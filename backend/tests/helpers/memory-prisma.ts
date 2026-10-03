import crypto from 'node:crypto';
import { vi } from 'vitest';
import { prisma } from '../../src/lib/prisma.js';
import type { AccountStatus, UserRole } from '../../src/types/auth.js';

interface MemoryUser {
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

interface MemoryRefreshToken {
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

const users: MemoryUser[] = [];
const refreshTokens: MemoryRefreshToken[] = [];

export function resetMemoryDb(): void {
  users.length = 0;
  refreshTokens.length = 0;
}

export function memoryUsers(): MemoryUser[] {
  return users.map((user) => ({ ...user }));
}

export function memoryRefreshTokens(): MemoryRefreshToken[] {
  return refreshTokens.map((token) => ({ ...token }));
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

export function installPrismaMemory(): void {
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
    const where = args.where as { familyId?: string; userId?: string; revokedAt?: null };
    const data = args.data as { revokedAt: Date };
    let count = 0;
    for (const token of refreshTokens) {
      const familyMatches = where.familyId ? token.familyId === where.familyId : true;
      const userMatches = where.userId ? token.userId === where.userId : true;
      const activeMatches = where.revokedAt === null ? token.revokedAt === null : true;
      if (familyMatches && userMatches && activeMatches) {
        token.revokedAt = data.revokedAt;
        count += 1;
      }
    }
    return { count } as never;
  });
}
