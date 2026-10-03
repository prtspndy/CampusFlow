import {
  Event,
  EventStatus,
  PaymentStatus,
  Prisma,
  RegistrationStatus,
  TicketStatus,
} from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { isPrismaCode } from '../lib/prisma-errors.js';
import { AuthenticatedUser, hasPermission } from '../types/auth.js';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors.js';
import { canManageRegistrationEvent, loadManagedEvent } from './event-access.js';
import { quoteEventPrice } from './pricing.js';
import { issueTicketRecord, toPublicTicket, withQr } from './ticket.service.js';

type Tx = Prisma.TransactionClient;

const ACTIVE_REGISTRATION: RegistrationStatus[] = [
  RegistrationStatus.PENDING_PAYMENT,
  RegistrationStatus.CONFIRMED,
];

/**
 * There is no registrationDeadline column. A published event accepts
 * registrations until startsAt. Capacity is reserved with a conditional
 * increment so two requests cannot both take the last seat.
 */
function assertRegistrationWindow(event: Event, user: AuthenticatedUser, now: Date): void {
  if (event.status !== EventStatus.PUBLISHED) {
    const canSeeUnpublished =
      event.organizerId === user.id ||
      hasPermission(user.role, 'events.read_drafts') ||
      hasPermission(user.role, 'events:read:drafts');
    if (!canSeeUnpublished) {
      throw new NotFoundError('Event not found');
    }
    throw new BadRequestError('Event is not open for registration', [], 'EVENT_NOT_OPEN');
  }

  if (event.startsAt.getTime() <= now.getTime()) {
    throw new BadRequestError('Registration is closed', [], 'REGISTRATION_CLOSED');
  }
}

async function reserveSeat(tx: Tx, eventId: string): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = await tx.event.findUnique({ where: { id: eventId } });
    if (!current || current.status !== EventStatus.PUBLISHED) {
      return false;
    }
    const reserved = await tx.event.updateMany({
      where: {
        id: current.id,
        status: EventStatus.PUBLISHED,
        registeredCount: current.registeredCount,
        OR: [{ totalCapacity: null }, { totalCapacity: { gt: current.registeredCount } }],
      },
      data: { registeredCount: { increment: 1 } },
    });
    if (reserved.count === 1) {
      return true;
    }
  }
  return false;
}

async function releaseSeat(tx: Tx, eventId: string): Promise<void> {
  await tx.event.updateMany({
    where: { id: eventId, registeredCount: { gt: 0 } },
    data: { registeredCount: { decrement: 1 } },
  });
}

export function toPublicRegistration(registration: {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  tier: string;
  amountPaise: number;
  currency: string;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: registration.id,
    eventId: registration.eventId,
    userId: registration.userId,
    status: registration.status,
    tier: registration.tier,
    amountPaise: registration.amountPaise,
    currency: registration.currency,
    cancelledAt: registration.cancelledAt,
    createdAt: registration.createdAt,
    updatedAt: registration.updatedAt,
  };
}

export async function registerForEvent(user: AuthenticatedUser, eventId: string) {
  const now = new Date();
  const preview = await prisma.event.findUnique({ where: { id: eventId } });
  if (!preview) {
    throw new NotFoundError('Event not found');
  }
  assertRegistrationWindow(preview, user, now);

  const existing = await prisma.eventRegistration.findFirst({
    where: { eventId, userId: user.id, status: { in: ACTIVE_REGISTRATION } },
  });
  if (existing) {
    throw new ConflictError('You are already registered for this event', 'ALREADY_REGISTERED');
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) {
        throw new NotFoundError('Event not found');
      }
      assertRegistrationWindow(event, user, now);

      const duplicate = await tx.eventRegistration.findFirst({
        where: { eventId, userId: user.id, status: { in: ACTIVE_REGISTRATION } },
      });
      if (duplicate) {
        throw new ConflictError('You are already registered for this event', 'ALREADY_REGISTERED');
      }

      const reserved = await reserveSeat(tx, event.id);
      if (!reserved) {
        throw new ConflictError('This event is at capacity', 'CAPACITY_REACHED');
      }

      const quote = await quoteEventPrice(tx, user.id, event, now);
      const registration = await tx.eventRegistration.create({
        data: {
          eventId: event.id,
          userId: user.id,
          status:
            quote.amountPaise === 0
              ? RegistrationStatus.CONFIRMED
              : RegistrationStatus.PENDING_PAYMENT,
          tier: quote.tier,
          amountPaise: quote.amountPaise,
          currency: quote.currency,
        },
      });

      if (quote.amountPaise === 0) {
        const issued = await issueTicketRecord(tx, registration);
        return { registration, issued };
      }

      return { registration, issued: null };
    });

    const ticket = created.issued
      ? await withQr(created.issued.ticket, created.issued.qrToken)
      : null;
    return {
      registration: toPublicRegistration(created.registration),
      ticket,
      payment: null,
    };
  } catch (error) {
    if (isPrismaCode(error, 'P2002')) {
      throw new ConflictError('You are already registered for this event', 'ALREADY_REGISTERED');
    }
    throw error;
  }
}

async function loadRegistration(registrationId: string) {
  const registration = await prisma.eventRegistration.findUnique({
    where: { id: registrationId },
    include: {
      event: true,
      ticket: true,
    },
  });
  if (!registration) {
    throw new NotFoundError('Registration not found');
  }
  return registration;
}

function assertCanReadRegistration(
  user: AuthenticatedUser,
  registration: { userId: string; event: { organizerId: string } },
): void {
  if (registration.userId === user.id) {
    return;
  }
  const staff =
    hasPermission(user.role, 'events.registrations.read') &&
    canManageRegistrationEvent(user, registration.event);
  if (!staff) {
    throw new NotFoundError('Registration not found');
  }
}

export async function getRegistration(user: AuthenticatedUser, registrationId: string) {
  const registration = await loadRegistration(registrationId);
  assertCanReadRegistration(user, registration);
  return {
    registration: toPublicRegistration(registration),
    ticket: registration.ticket ? toPublicTicket(registration.ticket) : null,
  };
}

export async function listOwnRegistrations(userId: string, page: number, limit: number) {
  const where = { userId };
  const [total, rows] = await Promise.all([
    prisma.eventRegistration.count({ where }),
    prisma.eventRegistration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            venue: true,
            startsAt: true,
            endsAt: true,
            status: true,
          },
        },
        ticket: true,
      },
    }),
  ]);

  return {
    registrations: rows.map((row) => ({
      ...toPublicRegistration(row),
      event: row.event,
      ticket: row.ticket ? toPublicTicket(row.ticket) : null,
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function listEventRegistrations(
  user: AuthenticatedUser,
  eventId: string,
  page: number,
  limit: number,
  status?: RegistrationStatus,
) {
  await loadManagedEvent(user, eventId);
  const where = {
    eventId,
    ...(status ? { status } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.eventRegistration.count({ where }),
    prisma.eventRegistration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        ticket: { select: { id: true, status: true, checkedInAt: true } },
      },
    }),
  ]);

  return {
    registrations: rows.map((row) => ({
      ...toPublicRegistration(row),
      user: row.user,
      ticket: row.ticket,
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function cancelRegistration(user: AuthenticatedUser, registrationId: string) {
  const registration = await loadRegistration(registrationId);
  const isOwner = registration.userId === user.id;
  const staff =
    hasPermission(user.role, 'events.registrations.manage') &&
    canManageRegistrationEvent(user, registration.event);
  if (!isOwner && !staff) {
    throw new NotFoundError('Registration not found');
  }
  if (registration.ticket?.status === TicketStatus.USED) {
    throw new ConflictError('A checked-in registration cannot be cancelled', 'ALREADY_CHECKED_IN');
  }
  if (!ACTIVE_REGISTRATION.includes(registration.status)) {
    throw new ConflictError('Registration cannot be cancelled', 'REGISTRATION_NOT_CANCELLABLE');
  }

  await prisma.$transaction(async (tx) => {
    const cancelled = await tx.eventRegistration.updateMany({
      where: { id: registration.id, status: { in: ACTIVE_REGISTRATION } },
      data: { status: RegistrationStatus.CANCELLED, cancelledAt: new Date() },
    });
    if (cancelled.count !== 1) {
      throw new ConflictError('Registration cannot be cancelled', 'REGISTRATION_NOT_CANCELLABLE');
    }

    await tx.ticket.updateMany({
      where: { registrationId: registration.id, status: TicketStatus.ISSUED },
      data: { status: TicketStatus.CANCELLED },
    });
    await tx.payment.updateMany({
      where: {
        registrationId: registration.id,
        status: { in: [PaymentStatus.CREATED, PaymentStatus.PENDING] },
      },
      data: { status: PaymentStatus.FAILED, failureReason: 'Registration cancelled' },
    });
    await releaseSeat(tx, registration.eventId);
  });

  const updated = await loadRegistration(registrationId);
  return {
    registration: toPublicRegistration(updated),
    ticket: updated.ticket ? toPublicTicket(updated.ticket) : null,
  };
}

/** Releases a pending seat when the event is no longer open. Returns true when released. */
export async function expirePendingRegistration(registrationId: string): Promise<boolean> {
  const registration = await prisma.eventRegistration.findUnique({
    where: { id: registrationId },
    include: { event: true },
  });
  if (!registration || registration.status !== RegistrationStatus.PENDING_PAYMENT) {
    return false;
  }

  const closed =
    registration.event.status !== EventStatus.PUBLISHED ||
    registration.event.startsAt.getTime() <= Date.now();
  if (!closed) {
    return false;
  }

  await prisma.$transaction(async (tx) => {
    const expired = await tx.eventRegistration.updateMany({
      where: { id: registrationId, status: RegistrationStatus.PENDING_PAYMENT },
      data: { status: RegistrationStatus.EXPIRED, cancelledAt: new Date() },
    });
    if (expired.count !== 1) {
      return;
    }
    await tx.payment.updateMany({
      where: {
        registrationId,
        status: { in: [PaymentStatus.CREATED, PaymentStatus.PENDING] },
      },
      data: { status: PaymentStatus.FAILED, failureReason: 'Registration expired' },
    });
    await releaseSeat(tx, registration.eventId);
  });
  return true;
}
