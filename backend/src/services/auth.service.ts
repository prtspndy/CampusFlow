import crypto from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { AuthSession, PublicUser, UserRole } from '../types/auth.js';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../utils/errors.js';
import { LoginInput, RegisterInput } from '../validators/auth.validators.js';
import { dummyPasswordHash, hashPassword, verifyPassword } from './password.service.js';
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshExpiryDate,
  signAccessToken,
} from './token.service.js';
import { publicUserSelect, toPublicUser } from './user.presenter.js';

const INVALID_CREDENTIALS = 'Invalid email or password';
const INVALID_REFRESH = 'Invalid or expired refresh token';

export async function registerUser(input: RegisterInput): Promise<PublicUser> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);

  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        role: 'MEMBER',
        status: 'active',
      },
    });
    return toPublicUser(user);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError('An account with this email already exists');
    }
    throw error;
  }
}

export async function loginUser(input: LoginInput): Promise<AuthSession> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const passwordMatches = await verifyPassword(
    input.password,
    user?.passwordHash ?? dummyPasswordHash(),
  );

  if (!user || !passwordMatches || user.status !== 'active') {
    const reason = !user
      ? 'unknown_user'
      : !passwordMatches
        ? 'invalid_password'
        : 'account_disabled';
    console.warn('[AUTH] Sign-in rejected', { reason });
    throw new UnauthorizedError(INVALID_CREDENTIALS, 'INVALID_CREDENTIALS');
  }

  const refreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshToken.hash,
      familyId: crypto.randomUUID(),
      expiresAt: refreshExpiryDate(),
    },
  });

  return {
    token: signAccessToken(user.id, user.tokenVersion),
    refreshToken: refreshToken.raw,
    expiresIn: env.JWT_ACCESS_TTL_SECONDS,
    user: toPublicUser(user),
  };
}

export async function refreshSession(rawRefreshToken: string): Promise<AuthSession> {
  const tokenHash = hashRefreshToken(rawRefreshToken);
  const outcome = await prisma.$transaction(
    async (tx) => {
      const stored = await tx.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (
        !stored ||
        !stored.user ||
        stored.expiresAt.getTime() <= Date.now() ||
        stored.user.status !== 'active'
      ) {
        return { status: 'invalid' as const };
      }

      if (stored.revokedAt) {
        await revokeTokenFamily(tx, stored.familyId);
        return { status: 'replay' as const };
      }

      // The conditional UPDATE is the concurrency guard. PostgreSQL locks the
      // row and rechecks `revokedAt IS NULL`, so only one transaction can
      // consume this token. A lost race must not revoke the winner's family.
      const consumed = await tx.refreshToken.updateMany({
        where: { id: stored.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      if (consumed.count !== 1) {
        return { status: 'invalid' as const };
      }

      const nextToken = generateRefreshToken();
      const created = await tx.refreshToken.create({
        data: {
          userId: stored.userId,
          tokenHash: nextToken.hash,
          familyId: stored.familyId,
          expiresAt: refreshExpiryDate(),
        },
      });

      await tx.refreshToken.update({
        where: { id: stored.id },
        data: { replacedById: created.id },
      });

      return {
        status: 'ok' as const,
        session: {
          token: signAccessToken(stored.user.id, stored.user.tokenVersion),
          refreshToken: nextToken.raw,
          expiresIn: env.JWT_ACCESS_TTL_SECONDS,
          user: toPublicUser(stored.user),
        },
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
  );

  if (outcome.status !== 'ok') {
    throw new UnauthorizedError(INVALID_REFRESH, 'INVALID_REFRESH_TOKEN');
  }

  return outcome.session;
}

export async function logoutUser(userId: string): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { tokenVersion: { increment: 1 } },
      });
      await tx.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
  );
}

export async function getUserById(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return toPublicUser(user);
}

export async function updateOwnProfile(userId: string, name: string): Promise<PublicUser> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name },
      select: publicUserSelect,
    });
    return toPublicUser(user);
  } catch (error) {
    if (isNotFound(error)) {
      throw new NotFoundError('User not found');
    }
    throw error;
  }
}

export async function listUsers(): Promise<PublicUser[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: publicUserSelect,
  });
  return users.map((user) => toPublicUser(user));
}

export async function updateUserRole(
  adminUserId: string,
  targetUserId: string,
  newRole: UserRole,
): Promise<PublicUser> {
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    throw new NotFoundError('User not found');
  }

  if (targetUser.role === newRole) {
    return toPublicUser(targetUser);
  }

  const updatedUser = await prisma.$transaction(
    async (tx) => {
      // Prevent demoting the last active administrator
      if (targetUser.role === 'ADMIN' && newRole !== 'ADMIN') {
        const activeAdminCount = await tx.user.count({
          where: { role: 'ADMIN', status: 'active' },
        });

        if (activeAdminCount <= 1) {
          throw new BadRequestError(
            'Cannot demote or change the role of the last active administrator',
          );
        }
      }

      // Invalidate refresh tokens and increment tokenVersion so active sessions are revoked
      const user = await tx.user.update({
        where: { id: targetUserId },
        data: {
          role: newRole,
          tokenVersion: { increment: 1 },
        },
        select: publicUserSelect,
      });

      await tx.refreshToken.updateMany({
        where: { userId: targetUserId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      return user;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
  );

  console.info(
    `[RBAC_AUDIT] Admin ${adminUserId} changed user ${targetUserId} role from ${targetUser.role} to ${newRole}`,
  );

  return toPublicUser(updatedUser);
}

type RefreshTokenWriter = Pick<typeof prisma, 'refreshToken'>;

async function revokeTokenFamily(tx: RefreshTokenWriter, familyId: string): Promise<void> {
  await tx.refreshToken.updateMany({
    where: { familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

function isNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}
