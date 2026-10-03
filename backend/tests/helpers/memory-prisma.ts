/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'node:crypto';
import { vi } from 'vitest';
import { prisma } from '../../src/lib/prisma.js';
import { normalizeRole, type AccountStatus, type UserRole } from '../../src/types/auth.js';
import {
  MembershipStatus,
  EventStatus,
  RegistrationStatus,
  PaymentStatus,
  TicketStatus,
  TicketTier,
} from '@prisma/client';

export interface MemoryUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  status: AccountStatus;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryRefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedById: string | null;
  createdAt: Date;
  user?: MemoryUser;
}

export interface MemoryMembership {
  id: string;
  userId: string;
  planName: string;
  status: MembershipStatus;
  validUntil: Date | null;
  renewalCount: number;
  perks: string[];
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: MemoryUser;
}

export interface MemoryEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  venue: string;
  imageUrl: string | null;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  price: number;
  memberPrice: number;
  standardPrice: number;
  totalCapacity: number | null;
  registeredCount: number;
  isFeatured: boolean;
  status: EventStatus;
  organizerId: string;
  createdAt: Date;
  updatedAt: Date;
  organizer?: MemoryUser;
}

export interface MemoryRegistration {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  tier: TicketTier;
  amountPaise: number;
  currency: string;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryPayment {
  id: string;
  registrationId: string;
  eventId: string;
  userId: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  amountPaise: number;
  currency: string;
  status: PaymentStatus;
  signatureVerifiedAt: Date | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryTicket {
  id: string;
  registrationId: string;
  eventId: string;
  userId: string;
  status: TicketStatus;
  verificationTokenHash: string;
  encryptedVerificationToken: string;
  issuedAt: Date;
  checkedInAt: Date | null;
  checkedInById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryCheckIn {
  id: string;
  ticketId: string;
  eventId: string;
  staffUserId: string;
  checkedInAt: Date;
}

export interface MemoryWebhookDelivery {
  id: string;
  eventType: string;
  razorpayOrderId: string | null;
  outcome: string;
  createdAt: Date;
}

const users: MemoryUser[] = [];
const refreshTokens: MemoryRefreshToken[] = [];
const memberships: MemoryMembership[] = [];
const events: MemoryEvent[] = [];
const registrations: MemoryRegistration[] = [];
const payments: MemoryPayment[] = [];
const tickets: MemoryTicket[] = [];
const checkIns: MemoryCheckIn[] = [];
const webhookDeliveries: MemoryWebhookDelivery[] = [];
let refreshReadWaiters: Array<() => void> | null = null;
let refreshReadTarget = 0;
let transactionQueue: Promise<void> = Promise.resolve();

export function resetMemoryDb(): void {
  users.length = 0;
  refreshTokens.length = 0;
  memberships.length = 0;
  events.length = 0;
  registrations.length = 0;
  payments.length = 0;
  tickets.length = 0;
  checkIns.length = 0;
  webhookDeliveries.length = 0;
  refreshReadWaiters = null;
  refreshReadTarget = 0;
  transactionQueue = Promise.resolve();
}

/**
 * Test-only gate for the in-memory fake. The next `count` refresh-token reads
 * wait until all of them have observed the row, then continue. This lets two
 * rotations pass the initial read before either conditional update runs.
 * It does not exercise PostgreSQL locking.
 */
export function overlapNextRefreshTokenReads(count: number): void {
  refreshReadWaiters = [];
  refreshReadTarget = count;
}

export function memoryUsers(): MemoryUser[] {
  return users.map((user) => ({ ...user }));
}

export function memoryRefreshTokens(): MemoryRefreshToken[] {
  return refreshTokens.map((token) => ({ ...token }));
}

export function memoryMemberships(): MemoryMembership[] {
  return memberships.map((membership) => ({ ...membership }));
}

export function memoryEvents(): MemoryEvent[] {
  return events.map((event) => ({ ...event }));
}

export function memoryRegistrations(): MemoryRegistration[] {
  return registrations.map((row) => ({ ...row }));
}

export function memoryPayments(): MemoryPayment[] {
  return payments.map((row) => ({ ...row }));
}

export function memoryTickets(): MemoryTicket[] {
  return tickets.map((row) => ({ ...row }));
}

export function memoryCheckIns(): MemoryCheckIn[] {
  return checkIns.map((row) => ({ ...row }));
}

export function insertRegistration(
  partial: Partial<MemoryRegistration> &
    Pick<MemoryRegistration, 'eventId' | 'userId' | 'status' | 'tier' | 'amountPaise'>,
): MemoryRegistration {
  const now = new Date();
  const row: MemoryRegistration = {
    id: partial.id ?? crypto.randomUUID(),
    eventId: partial.eventId,
    userId: partial.userId,
    status: partial.status,
    tier: partial.tier,
    amountPaise: partial.amountPaise,
    currency: partial.currency ?? 'INR',
    cancelledAt: partial.cancelledAt ?? null,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
  };
  registrations.push(row);
  return { ...row };
}

export function insertTicket(
  partial: Partial<MemoryTicket> &
    Pick<
      MemoryTicket,
      | 'registrationId'
      | 'eventId'
      | 'userId'
      | 'verificationTokenHash'
      | 'encryptedVerificationToken'
    >,
): MemoryTicket {
  const now = new Date();
  const row: MemoryTicket = {
    id: partial.id ?? crypto.randomUUID(),
    registrationId: partial.registrationId,
    eventId: partial.eventId,
    userId: partial.userId,
    status: partial.status ?? TicketStatus.ISSUED,
    verificationTokenHash: partial.verificationTokenHash,
    encryptedVerificationToken: partial.encryptedVerificationToken,
    issuedAt: partial.issuedAt ?? now,
    checkedInAt: partial.checkedInAt ?? null,
    checkedInById: partial.checkedInById ?? null,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
  };
  tickets.push(row);
  return { ...row };
}

export function insertUser(
  partial: Partial<MemoryUser> & Pick<MemoryUser, 'email' | 'name' | 'passwordHash'>,
): MemoryUser {
  const now = new Date();
  const rawRole = partial.role ?? 'MEMBER';
  const role: UserRole = normalizeRole(rawRole);
  const user: MemoryUser = {
    id: partial.id ?? crypto.randomUUID(),
    email: partial.email,
    name: partial.name,
    passwordHash: partial.passwordHash,
    role,
    status: partial.status ?? 'active',
    tokenVersion: partial.tokenVersion ?? 0,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
  };
  users.push(user);
  return { ...user };
}

export function insertMembership(
  partial: Partial<MemoryMembership> & Pick<MemoryMembership, 'userId' | 'planName'>,
): MemoryMembership {
  const now = new Date();
  const membership: MemoryMembership = {
    id: partial.id ?? crypto.randomUUID(),
    userId: partial.userId,
    planName: partial.planName,
    status: partial.status ?? MembershipStatus.PENDING,
    validUntil: partial.validUntil ?? null,
    renewalCount: partial.renewalCount ?? 0,
    perks: partial.perks ?? [],
    adminNotes: partial.adminNotes ?? null,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
  };
  memberships.push(membership);
  return { ...membership };
}

export function insertEvent(
  partial: Partial<MemoryEvent> &
    Pick<
      MemoryEvent,
      | 'title'
      | 'description'
      | 'category'
      | 'venue'
      | 'startsAt'
      | 'endsAt'
      | 'capacity'
      | 'organizerId'
    >,
): MemoryEvent {
  const now = new Date();
  const price = partial.price ?? 0;
  const event: MemoryEvent = {
    id: partial.id ?? crypto.randomUUID(),
    title: partial.title,
    description: partial.description,
    category: partial.category,
    venue: partial.venue,
    imageUrl: partial.imageUrl ?? null,
    startsAt: partial.startsAt,
    endsAt: partial.endsAt,
    capacity: partial.capacity,
    price,
    memberPrice: partial.memberPrice ?? price,
    standardPrice: partial.standardPrice ?? price,
    totalCapacity: partial.totalCapacity === undefined ? partial.capacity : partial.totalCapacity,
    registeredCount: partial.registeredCount ?? 0,
    isFeatured: partial.isFeatured ?? false,
    status: partial.status ?? EventStatus.DRAFT,
    organizerId: partial.organizerId,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
  };
  events.push(event);
  return { ...event };
}

export function expireRefreshTokens(): void {
  const expiredAt = new Date(Date.now() - 1000);
  for (const token of refreshTokens) {
    token.expiresAt = expiredAt;
  }
}

export function setUserStatus(email: string, status: AccountStatus): void {
  const user = users.find((entry) => entry.email === email);
  if (!user) {
    throw new Error(`No memory user for ${email}`);
  }
  user.status = status;
}

function snapshotState() {
  return {
    users: users.map((user) => ({ ...user })),
    refreshTokens: refreshTokens.map((token) => ({ ...token })),
    memberships: memberships.map((m) => ({ ...m })),
    events: events.map((e) => ({ ...e })),
    registrations: registrations.map((row) => ({ ...row })),
    payments: payments.map((row) => ({ ...row })),
    tickets: tickets.map((row) => ({ ...row })),
    checkIns: checkIns.map((row) => ({ ...row })),
    webhookDeliveries: webhookDeliveries.map((row) => ({ ...row })),
  };
}

function restoreState(state: ReturnType<typeof snapshotState>): void {
  users.splice(0, users.length, ...state.users.map((user) => ({ ...user })));
  refreshTokens.splice(
    0,
    refreshTokens.length,
    ...state.refreshTokens.map((token) => ({ ...token })),
  );
  memberships.splice(0, memberships.length, ...state.memberships.map((m) => ({ ...m })));
  events.splice(0, events.length, ...state.events.map((e) => ({ ...e })));
  registrations.splice(0, registrations.length, ...state.registrations.map((row) => ({ ...row })));
  payments.splice(0, payments.length, ...state.payments.map((row) => ({ ...row })));
  tickets.splice(0, tickets.length, ...state.tickets.map((row) => ({ ...row })));
  checkIns.splice(0, checkIns.length, ...state.checkIns.map((row) => ({ ...row })));
  webhookDeliveries.splice(
    0,
    webhookDeliveries.length,
    ...state.webhookDeliveries.map((row) => ({ ...row })),
  );
}

function uniqueError(): Error {
  const error = new Error('Unique constraint failed') as Error & { code: string };
  error.code = 'P2002';
  return error;
}

function matchesPrimitive(actual: unknown, filter: unknown): boolean {
  if (filter === undefined) return true;
  if (filter === null) return actual === null;
  if (typeof filter !== 'object' || filter instanceof Date) {
    if (actual instanceof Date && (filter instanceof Date || typeof filter === 'string')) {
      return actual.getTime() === new Date(filter as Date).getTime();
    }
    return actual === filter;
  }
  const ops = filter as Record<string, unknown>;
  if (Array.isArray(ops.in)) return ops.in.includes(actual);
  if ('gt' in ops) {
    if (actual instanceof Date) return actual.getTime() > new Date(ops.gt as Date).getTime();
    return typeof actual === 'number' && actual > Number(ops.gt);
  }
  if ('lt' in ops) return typeof actual === 'number' && actual < Number(ops.lt);
  return false;
}

function matchesWhere(record: Record<string, unknown>, where?: Record<string, unknown>): boolean {
  if (!where) return true;
  if (Array.isArray(where.AND) && !where.AND.every((clause) => matchesWhere(record, clause))) {
    return false;
  }
  if (Array.isArray(where.OR) && !where.OR.some((clause) => matchesWhere(record, clause))) {
    return false;
  }
  return Object.entries(where).every(([key, value]) => {
    if (key === 'AND' || key === 'OR') return true;
    return matchesPrimitive(record[key], value);
  });
}

function applyPatch(target: Record<string, any>, data: Record<string, any>): void {
  for (const [key, value] of Object.entries(data)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date) &&
      (typeof value.increment === 'number' || typeof value.decrement === 'number')
    ) {
      const current = typeof target[key] === 'number' ? target[key] : 0;
      if (typeof value.increment === 'number') target[key] = current + value.increment;
      if (typeof value.decrement === 'number') target[key] = current - value.decrement;
      continue;
    }
    target[key] = value;
  }
  if (data.startsAt) target.startsAt = new Date(data.startsAt);
  if (data.endsAt) target.endsAt = new Date(data.endsAt);
  if (data.checkedInAt) target.checkedInAt = new Date(data.checkedInAt);
  if (data.cancelledAt) target.cancelledAt = new Date(data.cancelledAt);
  if (data.signatureVerifiedAt) target.signatureVerifiedAt = new Date(data.signatureVerifiedAt);
  target.updatedAt = new Date();
}

export function installPrismaMemory(): void {
  vi.spyOn(prisma, '$transaction').mockImplementation((callback: unknown) => {
    if (typeof callback !== 'function') {
      return Promise.reject(new Error('Expected an interactive transaction')) as never;
    }
    const run = async () => {
      const snapshot = snapshotState();
      try {
        return await (callback as (tx: typeof prisma) => Promise<unknown>)(prisma);
      } catch (error) {
        restoreState(snapshot);
        throw error;
      }
    };
    // The refresh-token overlap test needs two transactions to read before either writes.
    if (refreshReadWaiters) {
      return run() as never;
    }
    const queued = transactionQueue.then(run, run);
    transactionQueue = queued.then(
      () => undefined,
      () => undefined,
    );
    return queued as never;
  });

  vi.spyOn(prisma.user, 'findUnique').mockImplementation(async (args) => {
    const where = args.where as { id?: string; email?: string };
    const user = users.find((entry) =>
      where.id ? entry.id === where.id : entry.email === where.email,
    );
    return (user ? { ...user } : null) as never;
  });

  vi.spyOn(prisma.user, 'create').mockImplementation(async (args) => {
    const data = args.data as MemoryUser;
    if (users.some((entry) => entry.email === data.email)) {
      const error = new Error('Unique constraint failed') as Error & { code: string };
      error.code = 'P2002';
      throw error;
    }
    return insertUser(data) as never;
  });

  vi.spyOn(prisma.user, 'update').mockImplementation(async (args) => {
    const where = args.where as { id: string };
    const data = args.data as {
      name?: string;
      role?: UserRole;
      tokenVersion?: { increment?: number };
    };
    const user = users.find((entry) => entry.id === where.id);
    if (!user) {
      const error = new Error('Record not found') as Error & { code: string };
      error.code = 'P2025';
      throw error;
    }
    if (typeof data.name === 'string') {
      user.name = data.name;
    }
    if (data.role) {
      user.role = normalizeRole(data.role);
    }
    if (data.tokenVersion?.increment) {
      user.tokenVersion += data.tokenVersion.increment;
    }
    user.updatedAt = new Date();
    return { ...user } as never;
  });

  vi.spyOn(prisma.user, 'count').mockImplementation(async (args) => {
    const where = args?.where as any;
    const matches = users.filter((u) => {
      if (where?.role && u.role !== normalizeRole(where.role)) return false;
      if (where?.status && u.status !== where.status) return false;
      return true;
    });
    return matches.length as never;
  });

  vi.spyOn(prisma.user, 'findMany').mockImplementation(async () => {
    return [...users]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map((user) => ({ ...user })) as never;
  });

  vi.spyOn(prisma.refreshToken, 'create').mockImplementation(async (args) => {
    const data = args.data as Omit<
      MemoryRefreshToken,
      'id' | 'createdAt' | 'revokedAt' | 'replacedById'
    >;
    const token: MemoryRefreshToken = {
      id: crypto.randomUUID(),
      userId: data.userId,
      tokenHash: data.tokenHash,
      familyId: data.familyId,
      expiresAt: data.expiresAt,
      revokedAt: null,
      replacedById: null,
      createdAt: new Date(),
    };
    refreshTokens.push(token);
    return { ...token } as never;
  });

  vi.spyOn(prisma.refreshToken, 'findUnique').mockImplementation(async (args) => {
    const where = args.where as { tokenHash: string };
    const token = refreshTokens.find((entry) => entry.tokenHash === where.tokenHash);
    if (refreshReadWaiters && refreshReadTarget > 0) {
      await new Promise<void>((resolve) => {
        refreshReadWaiters?.push(resolve);
        if (refreshReadWaiters && refreshReadWaiters.length >= refreshReadTarget) {
          const pending = refreshReadWaiters;
          refreshReadWaiters = null;
          refreshReadTarget = 0;
          pending.forEach((release) => release());
        }
      });
    }
    if (!token) {
      return null;
    }
    const user = users.find((entry) => entry.id === token.userId);
    return { ...token, user: user ? { ...user } : null } as never;
  });

  vi.spyOn(prisma.refreshToken, 'update').mockImplementation(async (args) => {
    const where = args.where as { id: string };
    const data = args.data as { revokedAt?: Date; replacedById?: string };
    const token = refreshTokens.find((entry) => entry.id === where.id);
    if (!token) {
      throw new Error('Refresh token not found');
    }
    if (data.revokedAt) {
      token.revokedAt = data.revokedAt;
    }
    if (data.replacedById) {
      token.replacedById = data.replacedById;
    }
    return { ...token } as never;
  });

  vi.spyOn(prisma.refreshToken, 'updateMany').mockImplementation(async (args) => {
    const where = args.where as {
      id?: string;
      familyId?: string;
      userId?: string;
      revokedAt?: null;
    };
    const data = args.data as { revokedAt?: Date };
    let count = 0;
    for (const token of refreshTokens) {
      const idMatches = where.id ? token.id === where.id : true;
      const familyMatches = where.familyId ? token.familyId === where.familyId : true;
      const userMatches = where.userId ? token.userId === where.userId : true;
      const activeMatches = where.revokedAt === null ? token.revokedAt === null : true;
      if (idMatches && familyMatches && userMatches && activeMatches) {
        if (data.revokedAt) {
          token.revokedAt = data.revokedAt;
        }
        count += 1;
      }
    }
    return { count } as never;
  });

  // Membership Mocks
  vi.spyOn(prisma.membership, 'findFirst').mockImplementation(async (args) => {
    const where = args?.where as any;
    const match = memberships.find((m) => {
      if (where?.userId && m.userId !== where.userId) return false;
      if (where?.status) {
        if (typeof where.status === 'string' && m.status !== where.status) return false;
        if (where.status?.in && !where.status.in.includes(m.status)) return false;
      }
      if (where?.validUntil?.gt) {
        if (!m.validUntil || m.validUntil.getTime() <= new Date(where.validUntil.gt).getTime()) {
          return false;
        }
      }
      return true;
    });
    return (match ? { ...match } : null) as never;
  });

  vi.spyOn(prisma.membership, 'findUnique').mockImplementation(async (args) => {
    const where = args?.where as { id: string };
    const match = memberships.find((m) => m.id === where.id);
    if (!match) return null as never;
    const user = users.find((u) => u.id === match.userId);
    return {
      ...match,
      ...(args?.include?.user ? { user: user ? { ...user } : undefined } : {}),
    } as never;
  });

  vi.spyOn(prisma.membership, 'findMany').mockImplementation(async (args) => {
    const where = args?.where as any;
    let matches = memberships.filter((m) => {
      if (where?.userId && m.userId !== where.userId) return false;
      if (where?.status && m.status !== where.status) return false;
      if (where?.planName && m.planName !== where.planName) return false;
      return true;
    });
    if (args?.orderBy?.createdAt === 'desc') {
      matches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    const skip = args?.skip ?? 0;
    const take = args?.take ?? matches.length;
    matches = matches.slice(skip, skip + take);
    return matches.map((m) => {
      const user = users.find((u) => u.id === m.userId);
      return {
        ...m,
        ...(args?.include?.user ? { user: user ? { ...user } : undefined } : {}),
      };
    }) as never;
  });

  vi.spyOn(prisma.membership, 'count').mockImplementation(async (args) => {
    const where = args?.where as any;
    const matches = memberships.filter((m) => {
      if (where?.userId && m.userId !== where.userId) return false;
      if (where?.status && m.status !== where.status) return false;
      if (where?.planName && m.planName !== where.planName) return false;
      return true;
    });
    return matches.length as never;
  });

  vi.spyOn(prisma.membership, 'create').mockImplementation(async (args) => {
    const data = args.data as any;
    const now = new Date();
    const membership: MemoryMembership = {
      id: data.id ?? crypto.randomUUID(),
      userId: data.userId,
      planName: data.planName,
      status: data.status,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      renewalCount: data.renewalCount ?? 0,
      perks: data.perks ?? [],
      adminNotes: data.adminNotes ?? null,
      createdAt: now,
      updatedAt: now,
    };
    memberships.push(membership);
    return { ...membership } as never;
  });

  vi.spyOn(prisma.membership, 'update').mockImplementation(async (args) => {
    const where = args.where as { id: string };
    const data = args.data as any;
    const match = memberships.find((m) => m.id === where.id);
    if (!match) {
      const err = new Error('Membership record not found') as Error & { code: string };
      err.code = 'P2025';
      throw err;
    }
    if (data.status) match.status = data.status;
    if (data.planName) match.planName = data.planName;
    if (data.validUntil !== undefined)
      match.validUntil = data.validUntil ? new Date(data.validUntil) : null;
    if (data.adminNotes !== undefined) match.adminNotes = data.adminNotes;
    if (data.perks) match.perks = data.perks;
    if (data.renewalCount?.increment) match.renewalCount += data.renewalCount.increment;
    match.updatedAt = new Date();
    return { ...match } as never;
  });

  // Event Mocks
  vi.spyOn(prisma.event, 'create').mockImplementation(async (args) => {
    const data = args.data as any;
    const now = new Date();
    const price = data.standardPrice ?? data.price ?? 0;
    const event: MemoryEvent = {
      id: data.id ?? crypto.randomUUID(),
      title: data.title,
      description: data.description,
      category: data.category ?? '',
      venue: data.venue,
      imageUrl: data.imageUrl ?? null,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      capacity: data.capacity ?? data.totalCapacity ?? 0,
      price,
      memberPrice: data.memberPrice ?? 0,
      standardPrice: price,
      totalCapacity:
        data.totalCapacity === undefined ? (data.capacity ?? null) : data.totalCapacity,
      registeredCount: data.registeredCount ?? 0,
      isFeatured: data.isFeatured ?? false,
      status: data.status ?? EventStatus.DRAFT,
      organizerId: data.organizerId,
      createdAt: now,
      updatedAt: now,
    };
    events.push(event);
    return { ...event } as never;
  });

  vi.spyOn(prisma.event, 'findUnique').mockImplementation(async (args) => {
    const where = args?.where as { id: string };
    const match = events.find((e) => e.id === where.id);
    if (!match) return null as never;
    const organizer = users.find((u) => u.id === match.organizerId);
    return {
      ...match,
      ...(args?.include?.organizer ? { organizer: organizer ? { ...organizer } : undefined } : {}),
    } as never;
  });

  vi.spyOn(prisma.event, 'findMany').mockImplementation(async (args) => {
    const where = args?.where as any;
    let matches = events.filter((e) => {
      if (where?.status && e.status !== where.status) return false;
      if (where?.category && e.category !== where.category) return false;
      if (where?.organizerId && e.organizerId !== where.organizerId) return false;
      if (where?.startsAt?.gte && e.startsAt < new Date(where.startsAt.gte)) return false;
      if (where?.startsAt?.lte && e.startsAt > new Date(where.startsAt.lte)) return false;
      if (where?.OR && Array.isArray(where.OR)) {
        const orMatched = where.OR.some((clause: any) => {
          if (clause.title?.contains)
            return e.title.toLowerCase().includes(clause.title.contains.toLowerCase());
          if (clause.description?.contains)
            return e.description.toLowerCase().includes(clause.description.contains.toLowerCase());
          if (clause.venue?.contains)
            return e.venue.toLowerCase().includes(clause.venue.contains.toLowerCase());
          return false;
        });
        if (!orMatched) return false;
      }
      return true;
    });
    if (args?.orderBy?.startsAt === 'asc') {
      matches.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    }
    const skip = args?.skip ?? 0;
    const take = args?.take ?? matches.length;
    matches = matches.slice(skip, skip + take);
    return matches.map((e) => {
      const organizer = users.find((u) => u.id === e.organizerId);
      return {
        ...e,
        ...(args?.include?.organizer
          ? { organizer: organizer ? { ...organizer } : undefined }
          : {}),
      };
    }) as never;
  });

  vi.spyOn(prisma.event, 'count').mockImplementation(async (args) => {
    const where = args?.where as any;
    const matches = events.filter((e) => {
      if (where?.status && e.status !== where.status) return false;
      if (where?.category && e.category !== where.category) return false;
      if (where?.organizerId && e.organizerId !== where.organizerId) return false;
      if (where?.startsAt?.gte && e.startsAt < new Date(where.startsAt.gte)) return false;
      if (where?.startsAt?.lte && e.startsAt > new Date(where.startsAt.lte)) return false;
      if (where?.OR && Array.isArray(where.OR)) {
        const orMatched = where.OR.some((clause: any) => {
          if (clause.title?.contains)
            return e.title.toLowerCase().includes(clause.title.contains.toLowerCase());
          if (clause.description?.contains)
            return e.description.toLowerCase().includes(clause.description.contains.toLowerCase());
          if (clause.venue?.contains)
            return e.venue.toLowerCase().includes(clause.venue.contains.toLowerCase());
          return false;
        });
        if (!orMatched) return false;
      }
      return true;
    });
    return matches.length as never;
  });

  vi.spyOn(prisma.event, 'update').mockImplementation(async (args) => {
    const where = args.where as { id: string };
    const data = args.data as any;
    const match = events.find((e) => e.id === where.id);
    if (!match) {
      const err = new Error('Event not found') as Error & { code: string };
      err.code = 'P2025';
      throw err;
    }
    applyPatch(match, data);
    return { ...match } as never;
  });

  vi.spyOn(prisma.event, 'updateMany').mockImplementation(async (args) => {
    const where = args.where as Record<string, unknown>;
    const data = args.data as Record<string, unknown>;
    let count = 0;
    for (const event of events) {
      if (!matchesWhere(event as unknown as Record<string, unknown>, where)) continue;
      applyPatch(event as unknown as Record<string, any>, data);
      count += 1;
    }
    return { count } as never;
  });

  const presentRegistration = (row: MemoryRegistration, include?: any) => {
    const result: any = { ...row };
    if (include?.user) {
      const user = users.find((entry) => entry.id === row.userId);
      result.user = user ? { id: user.id, name: user.name, email: user.email } : null;
    }
    if (include?.event === true || include?.event) {
      result.event = events.find((event) => event.id === row.eventId) ?? null;
    }
    if (include?.ticket) {
      result.ticket = tickets.find((ticket) => ticket.registrationId === row.id) ?? null;
    }
    return result;
  };

  vi.spyOn(prisma.eventRegistration, 'findFirst').mockImplementation(async (args) => {
    const match = registrations.find((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    return (match ? { ...match } : null) as never;
  });

  vi.spyOn(prisma.eventRegistration, 'findUnique').mockImplementation(async (args) => {
    const where = args?.where as { id: string };
    const match = registrations.find((row) => row.id === where.id);
    if (!match) return null as never;
    return presentRegistration(match, args?.include) as never;
  });

  vi.spyOn(prisma.eventRegistration, 'findMany').mockImplementation(async (args) => {
    let matches = registrations.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    if ((args?.orderBy as any)?.createdAt === 'desc') {
      matches = [...matches].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    const skip = args?.skip ?? 0;
    const take = args?.take ?? matches.length;
    return matches
      .slice(skip, skip + take)
      .map((row) => presentRegistration(row, args?.include)) as never;
  });

  vi.spyOn(prisma.eventRegistration, 'count').mockImplementation(async (args) => {
    return registrations.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    ).length as never;
  });

  vi.spyOn(prisma.eventRegistration, 'create').mockImplementation(async (args) => {
    const data = args.data as any;
    const active = registrations.some(
      (row) =>
        row.eventId === data.eventId &&
        row.userId === data.userId &&
        (row.status === RegistrationStatus.PENDING_PAYMENT ||
          row.status === RegistrationStatus.CONFIRMED) &&
        (data.status === RegistrationStatus.PENDING_PAYMENT ||
          data.status === RegistrationStatus.CONFIRMED),
    );
    if (active) throw uniqueError();
    const now = new Date();
    const row: MemoryRegistration = {
      id: data.id ?? crypto.randomUUID(),
      eventId: data.eventId,
      userId: data.userId,
      status: data.status,
      tier: data.tier,
      amountPaise: data.amountPaise,
      currency: data.currency ?? 'INR',
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    };
    registrations.push(row);
    return { ...row } as never;
  });

  vi.spyOn(prisma.eventRegistration, 'updateMany').mockImplementation(async (args) => {
    const where = args.where as any;
    const data = args.data as any;
    let count = 0;
    for (const row of registrations) {
      if (!matchesWhere(row as unknown as Record<string, unknown>, where)) continue;
      applyPatch(row as unknown as Record<string, any>, data);
      count += 1;
    }
    return { count } as never;
  });

  vi.spyOn(prisma.payment, 'findUnique').mockImplementation(async (args) => {
    const where = args?.where as any;
    const match = payments.find((row) => {
      if (where.id) return row.id === where.id;
      if (where.razorpayOrderId) return row.razorpayOrderId === where.razorpayOrderId;
      if (where.razorpayPaymentId) return row.razorpayPaymentId === where.razorpayPaymentId;
      return false;
    });
    return (match ? { ...match } : null) as never;
  });

  vi.spyOn(prisma.payment, 'findFirst').mockImplementation(async (args) => {
    let matches = payments.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    if ((args?.orderBy as any)?.createdAt === 'desc') {
      matches = [...matches].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return (matches[0] ? { ...matches[0] } : null) as never;
  });

  vi.spyOn(prisma.payment, 'findMany').mockImplementation(async (args) => {
    let matches = payments.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    if ((args?.orderBy as any)?.createdAt === 'desc') {
      matches = [...matches].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    const skip = args?.skip ?? 0;
    const take = args?.take ?? matches.length;
    return matches.slice(skip, skip + take).map((row) => ({ ...row })) as never;
  });

  vi.spyOn(prisma.payment, 'count').mockImplementation(async (args) => {
    return payments.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    ).length as never;
  });

  vi.spyOn(prisma.payment, 'create').mockImplementation(async (args) => {
    const data = args.data as any;
    if (
      data.razorpayOrderId &&
      payments.some((row) => row.razorpayOrderId === data.razorpayOrderId)
    ) {
      throw uniqueError();
    }
    if (
      data.razorpayPaymentId &&
      payments.some((row) => row.razorpayPaymentId === data.razorpayPaymentId)
    ) {
      throw uniqueError();
    }
    const sameRegistration = payments.filter((row) => row.registrationId === data.registrationId);
    if (
      (data.status === PaymentStatus.CREATED || data.status === PaymentStatus.PENDING) &&
      sameRegistration.some(
        (row) => row.status === PaymentStatus.CREATED || row.status === PaymentStatus.PENDING,
      )
    ) {
      throw uniqueError();
    }
    if (
      (data.status === PaymentStatus.PAID || data.status === PaymentStatus.REFUNDED) &&
      sameRegistration.some(
        (row) => row.status === PaymentStatus.PAID || row.status === PaymentStatus.REFUNDED,
      )
    ) {
      throw uniqueError();
    }
    const now = new Date();
    const row: MemoryPayment = {
      id: data.id ?? crypto.randomUUID(),
      registrationId: data.registrationId,
      eventId: data.eventId,
      userId: data.userId,
      razorpayOrderId: data.razorpayOrderId ?? null,
      razorpayPaymentId: data.razorpayPaymentId ?? null,
      amountPaise: data.amountPaise,
      currency: data.currency ?? 'INR',
      status: data.status ?? PaymentStatus.CREATED,
      signatureVerifiedAt: null,
      failureReason: data.failureReason ?? null,
      createdAt: now,
      updatedAt: now,
    };
    payments.push(row);
    return { ...row } as never;
  });

  vi.spyOn(prisma.payment, 'update').mockImplementation(async (args) => {
    const where = args.where as { id: string };
    const match = payments.find((row) => row.id === where.id);
    if (!match) {
      const error = new Error('Payment not found') as Error & { code: string };
      error.code = 'P2025';
      throw error;
    }
    applyPatch(match as unknown as Record<string, any>, args.data as any);
    return { ...match } as never;
  });

  vi.spyOn(prisma.payment, 'updateMany').mockImplementation(async (args) => {
    const where = args.where as any;
    const data = args.data as any;
    let count = 0;
    for (const row of payments) {
      if (!matchesWhere(row as unknown as Record<string, unknown>, where)) continue;
      applyPatch(row as unknown as Record<string, any>, data);
      count += 1;
    }
    return { count } as never;
  });

  const presentTicket = (row: MemoryTicket, args?: any) => {
    const include = args?.include;
    const result: any = { ...row };
    if (include?.user) {
      const user = users.find((entry) => entry.id === row.userId);
      result.user = user ? { id: user.id, name: user.name, email: user.email } : null;
    }
    if (include?.registration) {
      result.registration = registrations.find((entry) => entry.id === row.registrationId) ?? null;
    }
    if (include?.event) {
      const event = events.find((entry) => entry.id === row.eventId);
      result.event = event ? { ...event } : null;
    }
    return result;
  };

  vi.spyOn(prisma.ticket, 'findUnique').mockImplementation(async (args) => {
    const where = args?.where as any;
    const match = tickets.find((row) => {
      if (where.id) return row.id === where.id;
      if (where.registrationId) return row.registrationId === where.registrationId;
      if (where.verificationTokenHash)
        return row.verificationTokenHash === where.verificationTokenHash;
      return false;
    });
    return (match ? presentTicket(match, args) : null) as never;
  });

  vi.spyOn(prisma.ticket, 'findMany').mockImplementation(async (args) => {
    let matches = tickets.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    if ((args?.orderBy as any)?.issuedAt === 'desc') {
      matches = [...matches].sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime());
    }
    const skip = args?.skip ?? 0;
    const take = args?.take ?? matches.length;
    return matches.slice(skip, skip + take).map((row) => presentTicket(row, args)) as never;
  });

  vi.spyOn(prisma.ticket, 'count').mockImplementation(async (args) => {
    return tickets.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    ).length as never;
  });

  vi.spyOn(prisma.ticket, 'create').mockImplementation(async (args) => {
    const data = args.data as any;
    if (tickets.some((row) => row.registrationId === data.registrationId)) throw uniqueError();
    if (tickets.some((row) => row.verificationTokenHash === data.verificationTokenHash)) {
      throw uniqueError();
    }
    const now = new Date();
    const row: MemoryTicket = {
      id: data.id ?? crypto.randomUUID(),
      registrationId: data.registrationId,
      eventId: data.eventId,
      userId: data.userId,
      status: data.status ?? TicketStatus.ISSUED,
      verificationTokenHash: data.verificationTokenHash,
      encryptedVerificationToken: data.encryptedVerificationToken,
      issuedAt: now,
      checkedInAt: null,
      checkedInById: null,
      createdAt: now,
      updatedAt: now,
    };
    tickets.push(row);
    return { ...row } as never;
  });

  vi.spyOn(prisma.ticket, 'updateMany').mockImplementation(async (args) => {
    const where = args.where as any;
    const data = args.data as any;
    let count = 0;
    for (const row of tickets) {
      if (!matchesWhere(row as unknown as Record<string, unknown>, where)) continue;
      applyPatch(row as unknown as Record<string, any>, data);
      count += 1;
    }
    return { count } as never;
  });

  vi.spyOn(prisma.checkIn, 'count').mockImplementation(async (args) => {
    return checkIns.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    ).length as never;
  });

  vi.spyOn(prisma.checkIn, 'findMany').mockImplementation(async (args) => {
    let matches = checkIns.filter((row) =>
      matchesWhere(row as unknown as Record<string, unknown>, args?.where as any),
    );
    if ((args?.orderBy as any)?.checkedInAt === 'desc') {
      matches = [...matches].sort((a, b) => b.checkedInAt.getTime() - a.checkedInAt.getTime());
    }
    const skip = args?.skip ?? 0;
    const take = args?.take ?? matches.length;
    return matches.slice(skip, skip + take).map((row) => {
      const ticket = tickets.find((entry) => entry.id === row.ticketId);
      const holder = ticket ? users.find((entry) => entry.id === ticket.userId) : undefined;
      const registration = ticket
        ? registrations.find((entry) => entry.id === ticket.registrationId)
        : undefined;
      const staff = users.find((entry) => entry.id === row.staffUserId);
      return {
        ...row,
        staff: staff ? { id: staff.id, name: staff.name } : null,
        ticket: ticket
          ? {
              ...ticket,
              user: holder ? { id: holder.id, name: holder.name, email: holder.email } : null,
              registration: registration ? { tier: registration.tier } : null,
            }
          : null,
      };
    }) as never;
  });

  vi.spyOn(prisma.checkIn, 'create').mockImplementation(async (args) => {
    const data = args.data as any;
    if (checkIns.some((row) => row.ticketId === data.ticketId)) throw uniqueError();
    const row: MemoryCheckIn = {
      id: data.id ?? crypto.randomUUID(),
      ticketId: data.ticketId,
      eventId: data.eventId,
      staffUserId: data.staffUserId,
      checkedInAt: data.checkedInAt ? new Date(data.checkedInAt) : new Date(),
    };
    checkIns.push(row);
    return { ...row } as never;
  });

  vi.spyOn(prisma.paymentWebhookDelivery, 'create').mockImplementation(async (args) => {
    const data = args.data as any;
    if (webhookDeliveries.some((row) => row.id === data.id)) throw uniqueError();
    const row: MemoryWebhookDelivery = {
      id: data.id,
      eventType: data.eventType,
      razorpayOrderId: data.razorpayOrderId ?? null,
      outcome: data.outcome,
      createdAt: new Date(),
    };
    webhookDeliveries.push(row);
    return { ...row } as never;
  });

  vi.spyOn(prisma.paymentWebhookDelivery, 'update').mockImplementation(async (args) => {
    const where = args.where as { id: string };
    const match = webhookDeliveries.find((row) => row.id === where.id);
    if (!match) throw new Error('Webhook delivery not found');
    applyPatch(match as unknown as Record<string, any>, args.data as any);
    return { ...match } as never;
  });
}
