/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'node:crypto';
import { vi } from 'vitest';
import { prisma } from '../../src/lib/prisma.js';
import type { AccountStatus, UserRole } from '../../src/types/auth.js';
import { MembershipStatus, EventStatus } from '@prisma/client';

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
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  price: number;
  status: EventStatus;
  organizerId: string;
  createdAt: Date;
  updatedAt: Date;
  organizer?: MemoryUser;
}

const users: MemoryUser[] = [];
const refreshTokens: MemoryRefreshToken[] = [];
const memberships: MemoryMembership[] = [];
const events: MemoryEvent[] = [];
let refreshReadWaiters: Array<() => void> | null = null;
let refreshReadTarget = 0;

export function resetMemoryDb(): void {
  users.length = 0;
  refreshTokens.length = 0;
  memberships.length = 0;
  events.length = 0;
  refreshReadWaiters = null;
  refreshReadTarget = 0;
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

export function insertUser(
  partial: Partial<MemoryUser> & Pick<MemoryUser, 'email' | 'name' | 'passwordHash'>,
): MemoryUser {
  const now = new Date();
  const user: MemoryUser = {
    id: partial.id ?? crypto.randomUUID(),
    email: partial.email,
    name: partial.name,
    passwordHash: partial.passwordHash,
    role: partial.role ?? 'member',
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
  const event: MemoryEvent = {
    id: partial.id ?? crypto.randomUUID(),
    title: partial.title,
    description: partial.description,
    category: partial.category,
    venue: partial.venue,
    startsAt: partial.startsAt,
    endsAt: partial.endsAt,
    capacity: partial.capacity,
    price: partial.price ?? 0,
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

function snapshotState(): {
  users: MemoryUser[];
  refreshTokens: MemoryRefreshToken[];
  memberships: MemoryMembership[];
  events: MemoryEvent[];
} {
  return {
    users: users.map((user) => ({ ...user })),
    refreshTokens: refreshTokens.map((token) => ({ ...token })),
    memberships: memberships.map((m) => ({ ...m })),
    events: events.map((e) => ({ ...e })),
  };
}

function restoreState(state: {
  users: MemoryUser[];
  refreshTokens: MemoryRefreshToken[];
  memberships: MemoryMembership[];
  events: MemoryEvent[];
}): void {
  users.splice(0, users.length, ...state.users.map((user) => ({ ...user })));
  refreshTokens.splice(
    0,
    refreshTokens.length,
    ...state.refreshTokens.map((token) => ({ ...token })),
  );
  memberships.splice(0, memberships.length, ...state.memberships.map((m) => ({ ...m })));
  events.splice(0, events.length, ...state.events.map((e) => ({ ...e })));
}

export function installPrismaMemory(): void {
  vi.spyOn(prisma, '$transaction').mockImplementation((callback: unknown) => {
    if (typeof callback !== 'function') {
      return Promise.reject(new Error('Expected an interactive transaction')) as never;
    }
    const snapshot = snapshotState();
    return Promise.resolve()
      .then(() => callback(prisma))
      .catch((error: unknown) => {
        restoreState(snapshot);
        throw error;
      }) as never;
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
    if (data.tokenVersion?.increment) {
      user.tokenVersion += data.tokenVersion.increment;
    }
    user.updatedAt = new Date();
    return { ...user } as never;
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
    const event: MemoryEvent = {
      id: data.id ?? crypto.randomUUID(),
      title: data.title,
      description: data.description,
      category: data.category,
      venue: data.venue,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      capacity: data.capacity,
      price: data.price ?? 0,
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
    Object.assign(match, data);
    if (data.startsAt) match.startsAt = new Date(data.startsAt);
    if (data.endsAt) match.endsAt = new Date(data.endsAt);
    match.updatedAt = new Date();
    return { ...match } as never;
  });
}
