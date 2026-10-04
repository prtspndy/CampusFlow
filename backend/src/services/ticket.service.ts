import {
  EventRegistration,
  PaymentStatus,
  Prisma,
  RegistrationStatus,
  Ticket,
  TicketStatus,
} from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { isPrismaCode } from '../lib/prisma-errors.js';
import { AuthenticatedUser, hasPermission } from '../types/auth.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';
import { canManageRegistrationEvent, loadManagedEvent } from './event-access.js';
import {
  decryptVerificationToken,
  encryptVerificationToken,
  generateVerificationToken,
  hashVerificationToken,
  toQrDataUrl,
} from './ticket-crypto.js';

type Tx = Prisma.TransactionClient;

const holderSelect = { id: true, name: true, email: true } as const;

export interface IssuedTicket {
  ticket: Ticket;
  qrToken: string;
}

export async function issueTicketsForRegistration(
  tx: Tx,
  registration: Pick<EventRegistration, 'id' | 'eventId' | 'userId'> & { quantity?: number },
): Promise<IssuedTicket[]> {
  const targetQuantity = registration.quantity ?? 1;
  const existing = await tx.ticket.findMany({
    where: { registrationId: registration.id },
    orderBy: { createdAt: 'asc' },
  });

  const issuedList: IssuedTicket[] = existing.map((ticket) => ({
    ticket,
    qrToken: decryptVerificationToken(ticket.encryptedVerificationToken),
  }));

  const needed = Math.max(0, targetQuantity - existing.length);
  for (let i = 0; i < needed; i += 1) {
    const qrToken = generateVerificationToken();
    const ticket = await tx.ticket.create({
      data: {
        registrationId: registration.id,
        eventId: registration.eventId,
        userId: registration.userId,
        status: TicketStatus.ISSUED,
        verificationTokenHash: hashVerificationToken(qrToken),
        encryptedVerificationToken: encryptVerificationToken(qrToken),
      },
    });
    issuedList.push({ ticket, qrToken });
  }

  return issuedList;
}

export async function issueTicketRecord(
  tx: Tx,
  registration: Pick<EventRegistration, 'id' | 'eventId' | 'userId'> & { quantity?: number },
): Promise<IssuedTicket> {
  const results = await issueTicketsForRegistration(tx, registration);
  if (!results[0]) {
    throw new Error('Failed to issue ticket record');
  }
  return results[0];
}

export function toPublicTicket(ticket: Ticket, qr?: { token: string; dataUrl: string }) {
  return {
    id: ticket.id,
    registrationId: ticket.registrationId,
    eventId: ticket.eventId,
    userId: ticket.userId,
    status: ticket.status,
    issuedAt: ticket.issuedAt,
    checkedInAt: ticket.checkedInAt,
    checkedInById: ticket.checkedInById,
    ...(qr ? { qrToken: qr.token, qrDataUrl: qr.dataUrl } : {}),
  };
}

export async function withQr(ticket: Ticket, qrToken: string) {
  return toPublicTicket(ticket, { token: qrToken, dataUrl: await toQrDataUrl(qrToken) });
}

async function registrationIsPaid(
  tx: Tx | typeof prisma,
  registration: { id: string; status: RegistrationStatus; amountPaise: number },
): Promise<boolean> {
  if (registration.status !== RegistrationStatus.CONFIRMED) {
    return false;
  }
  if (registration.amountPaise === 0) {
    return true;
  }
  const paid = await tx.payment.findFirst({
    where: { registrationId: registration.id, status: PaymentStatus.PAID },
  });
  return Boolean(paid);
}

function scanTicket(ticket: {
  id: string;
  eventId: string;
  status: TicketStatus;
  checkedInAt: Date | null;
  user: { id: string; name: string; email: string };
  registration: { tier: string; status: RegistrationStatus; amountPaise: number };
}) {
  return {
    id: ticket.id,
    eventId: ticket.eventId,
    status: ticket.status,
    checkedInAt: ticket.checkedInAt,
    tier: ticket.registration.tier,
    holderName: ticket.user.name,
    holderEmail: ticket.user.email,
  };
}

export async function validateTicket(user: AuthenticatedUser, eventId: string, token: string) {
  await loadManagedEvent(user, eventId);
  const ticket = await prisma.ticket.findUnique({
    where: { verificationTokenHash: hashVerificationToken(token) },
    include: {
      user: { select: holderSelect },
      registration: { select: { id: true, tier: true, status: true, amountPaise: true } },
    },
  });

  if (!ticket) {
    return { result: 'INVALID' as const, ticket: null };
  }

  const summary = scanTicket(ticket);
  if (ticket.eventId !== eventId) {
    return { result: 'WRONG_EVENT' as const, ticket: summary };
  }
  if (ticket.status === TicketStatus.CANCELLED) {
    return { result: 'CANCELLED' as const, ticket: summary };
  }
  if (!(await registrationIsPaid(prisma, ticket.registration))) {
    return { result: 'UNPAID' as const, ticket: summary };
  }
  if (ticket.status === TicketStatus.USED) {
    return { result: 'USED' as const, ticket: summary };
  }
  return { result: 'VALID' as const, ticket: summary };
}

export async function checkInTicket(user: AuthenticatedUser, eventId: string, token: string) {
  const event = await loadManagedEvent(user, eventId);
  if (event.status !== 'PUBLISHED') {
    throw new ConflictError('Check-in is only available for published events', 'EVENT_NOT_OPEN');
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: { verificationTokenHash: hashVerificationToken(token) },
        include: {
          user: { select: holderSelect },
          registration: { select: { id: true, tier: true, status: true, amountPaise: true } },
        },
      });

      if (!ticket) {
        throw new NotFoundError('Ticket not found', 'TICKET_INVALID');
      }
      if (ticket.eventId !== eventId) {
        throw new ConflictError('Ticket belongs to a different event', 'TICKET_EVENT_MISMATCH');
      }
      if (ticket.status === TicketStatus.CANCELLED) {
        throw new ConflictError('Ticket has been cancelled', 'TICKET_CANCELLED');
      }
      if (ticket.status === TicketStatus.USED) {
        throw new ConflictError('Ticket has already been checked in', 'ALREADY_CHECKED_IN');
      }
      if (!(await registrationIsPaid(tx, ticket.registration))) {
        throw new ConflictError('Ticket is not paid', 'TICKET_UNPAID');
      }

      const checkedInAt = new Date();
      const updated = await tx.ticket.updateMany({
        where: { id: ticket.id, eventId, status: TicketStatus.ISSUED },
        data: {
          status: TicketStatus.USED,
          checkedInAt,
          checkedInById: user.id,
        },
      });

      if (updated.count !== 1) {
        const current = await tx.ticket.findUnique({ where: { id: ticket.id } });
        if (current?.status === TicketStatus.USED) {
          throw new ConflictError('Ticket has already been checked in', 'ALREADY_CHECKED_IN');
        }
        throw new ConflictError('Ticket cannot be checked in', 'TICKET_NOT_ELIGIBLE');
      }

      await tx.checkIn.create({
        data: {
          ticketId: ticket.id,
          eventId,
          staffUserId: user.id,
          checkedInAt,
        },
      });

      return {
        result: 'CHECKED_IN' as const,
        ticket: {
          ...scanTicket(ticket),
          status: TicketStatus.USED,
          checkedInAt,
          checkedInById: user.id,
        },
      };
    });
  } catch (error) {
    if (isPrismaCode(error, 'P2002')) {
      throw new ConflictError('Ticket has already been checked in', 'ALREADY_CHECKED_IN');
    }
    throw error;
  }
}

export async function listAttendance(
  user: AuthenticatedUser,
  eventId: string,
  page: number,
  limit: number,
) {
  await loadManagedEvent(user, eventId);
  const where = { eventId };
  const [total, rows] = await Promise.all([
    prisma.checkIn.count({ where }),
    prisma.checkIn.findMany({
      where,
      orderBy: { checkedInAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        staff: { select: { id: true, name: true } },
        ticket: {
          select: {
            id: true,
            status: true,
            user: { select: holderSelect },
            registration: { select: { tier: true } },
          },
        },
      },
    }),
  ]);

  return {
    attendance: rows.map((row) => ({
      id: row.id,
      ticketId: row.ticketId,
      eventId: row.eventId,
      checkedInAt: row.checkedInAt,
      staff: row.staff,
      holderName: row.ticket.user.name,
      holderEmail: row.ticket.user.email,
      tier: row.ticket.registration.tier,
      ticketStatus: row.ticket.status,
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function listOwnTickets(userId: string, page: number, limit: number) {
  const where = { userId };
  const [total, rows] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.findMany({
      where,
      orderBy: { issuedAt: 'desc' },
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
      },
    }),
  ]);

  return {
    tickets: rows.map((ticket) => ({
      ...toPublicTicket(ticket),
      qrAvailable: ticket.status === TicketStatus.ISSUED || ticket.status === TicketStatus.USED,
      event: ticket.event,
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getOwnTicket(user: AuthenticatedUser, ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          venue: true,
          startsAt: true,
          endsAt: true,
          status: true,
          organizerId: true,
        },
      },
    },
  });

  if (!ticket) {
    throw new NotFoundError('Ticket not found');
  }

  const isOwner = ticket.userId === user.id;
  const staffCanView =
    hasPermission(user.role, 'tickets.validate') && canManageRegistrationEvent(user, ticket.event);
  if (!isOwner && !staffCanView) {
    throw new NotFoundError('Ticket not found');
  }

  return {
    ...toPublicTicket(ticket),
    event: {
      id: ticket.event.id,
      title: ticket.event.title,
      venue: ticket.event.venue,
      startsAt: ticket.event.startsAt,
      endsAt: ticket.event.endsAt,
      status: ticket.event.status,
    },
  };
}

export async function getTicketQr(userId: string, ticketId: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.userId !== userId) {
    throw new NotFoundError('Ticket not found');
  }
  if (ticket.status === TicketStatus.CANCELLED) {
    throw new ConflictError('Ticket has been cancelled', 'TICKET_CANCELLED');
  }

  const qrToken = decryptVerificationToken(ticket.encryptedVerificationToken);
  return {
    ticketId: ticket.id,
    status: ticket.status,
    qrToken,
    qrDataUrl: await toQrDataUrl(qrToken),
  };
}
