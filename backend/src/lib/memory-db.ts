import crypto from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import type { AccountStatus, UserRole } from '../types/auth.js';
import { hashPassword } from '../services/password.service.js';

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

/**
 * Pre-seeds initial demo users into the in-memory database for local development.
 */
async function seedInitialUsers(): Promise<void> {
  if (users.length > 0) return;

  const adminHash = await hashPassword('AdminPass2026!');
  const memberHash = await hashPassword('MemberPass2026!');

  users.push(
    {
      id: 'e1e4a001-0000-4000-8000-000000000001',
      email: 'president@skyline.edu',
      name: 'Elena Rostova',
      passwordHash: adminHash,
      role: 'admin',
      status: 'active',
      tokenVersion: 0,
      createdAt: new Date(Date.now() - 86400000 * 30),
      updatedAt: new Date(),
    },
    {
      id: 'e1e4a002-0000-4000-8000-000000000002',
      email: 'aanya.patel@skyline.edu',
      name: 'Aanya Patel',
      passwordHash: memberHash,
      role: 'member',
      status: 'active',
      tokenVersion: 0,
      createdAt: new Date(Date.now() - 86400000 * 15),
      updatedAt: new Date(),
    },
  );
}

/**
 * Installs an in-memory database provider on the Prisma client instance
 * so local development and frontend testing work without needing a live PostgreSQL server.
 */
export function installDevMemoryStore(prisma: PrismaClient): void {
  void seedInitialUsers();

  // Intercept interactive $transaction
  prisma.$transaction = (async (callback: unknown) => {
    if (typeof callback !== 'function') {
      return Promise.resolve([]) as never;
    }
    return callback(prisma);
  }) as never;

  // Intercept raw query for health readiness checks
  prisma.$queryRaw = (async () => {
    return [{ '?column?': 1 }];
  }) as never;

  // Intercept User model
  prisma.user.findUnique = (async (args: { where: { id?: string; email?: string } }) => {
    const { id, email } = args.where;
    const user = users.find((u) => (id ? u.id === id : email ? u.email === email : false));
    return user ? { ...user } : null;
  }) as never;

  prisma.user.findMany = (async () => {
    return [...users]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((u) => ({ ...u }));
  }) as never;

  prisma.user.create = (async (args: { data: Omit<MemoryUser, 'id' | 'createdAt' | 'updatedAt' | 'tokenVersion'> & { id?: string } }) => {
    const { data } = args;
    if (users.some((u) => u.email === data.email)) {
      const err = new Error('Unique constraint failed on the fields: (`email`)') as Error & { code: string };
      err.code = 'P2002';
      throw err;
    }

    const now = new Date();
    const newUser: MemoryUser = {
      id: data.id ?? crypto.randomUUID(),
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      role: data.role ?? 'member',
      status: data.status ?? 'active',
      tokenVersion: 0,
      createdAt: now,
      updatedAt: now,
    };

    users.push(newUser);
    return { ...newUser };
  }) as never;

  prisma.user.update = (async (args: {
    where: { id: string };
    data: { name?: string; tokenVersion?: { increment?: number } };
  }) => {
    const user = users.find((u) => u.id === args.where.id);
    if (!user) {
      const err = new Error('Record not found') as Error & { code: string };
      err.code = 'P2025';
      throw err;
    }

    if (typeof args.data.name === 'string') {
      user.name = args.data.name;
    }
    if (args.data.tokenVersion?.increment) {
      user.tokenVersion += args.data.tokenVersion.increment;
    }
    user.updatedAt = new Date();
    return { ...user };
  }) as never;

  // Intercept RefreshToken model
  prisma.refreshToken.create = (async (args: {
    data: { userId: string; tokenHash: string; familyId: string; expiresAt: Date };
  }) => {
    const token: MemoryRefreshToken = {
      id: crypto.randomUUID(),
      userId: args.data.userId,
      tokenHash: args.data.tokenHash,
      familyId: args.data.familyId,
      expiresAt: args.data.expiresAt,
      revokedAt: null,
      replacedById: null,
      createdAt: new Date(),
    };
    refreshTokens.push(token);
    return { ...token };
  }) as never;

  prisma.refreshToken.findUnique = (async (args: { where: { tokenHash: string } }) => {
    const token = refreshTokens.find((t) => t.tokenHash === args.where.tokenHash);
    if (!token) return null;
    const user = users.find((u) => u.id === token.userId);
    return { ...token, user: user ? { ...user } : null };
  }) as never;

  prisma.refreshToken.update = (async (args: {
    where: { id: string };
    data: { revokedAt?: Date; replacedById?: string };
  }) => {
    const token = refreshTokens.find((t) => t.id === args.where.id);
    if (!token) {
      throw new Error('Refresh token not found');
    }
    if (args.data.revokedAt) {
      token.revokedAt = args.data.revokedAt;
    }
    if (args.data.replacedById) {
      token.replacedById = args.data.replacedById;
    }
    return { ...token };
  }) as never;

  prisma.refreshToken.updateMany = (async (args: {
    where: { id?: string; familyId?: string; userId?: string; revokedAt?: null };
    data: { revokedAt?: Date };
  }) => {
    const { where, data } = args;
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
    return { count };
  }) as never;

  console.log('⚡ [DEV] In-memory development database activated (No external PostgreSQL required)');
}
