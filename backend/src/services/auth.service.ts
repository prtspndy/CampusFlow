import crypto from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { AuthSession, PublicUser } from '../types/auth.js';
import {
  ConflictError,
  ForbiddenError,
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
import { toPublicUser } from './user.presenter.js';

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
        role: 'member',
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

  if (!user || !passwordMatches) {
    throw new UnauthorizedError(INVALID_CREDENTIALS, 'INVALID_CREDENTIALS');
  }

  if (user.status !== 'active') {
    throw new ForbiddenError('This account is disabled', 'ACCOUNT_DISABLED');
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
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashRefreshToken(rawRefreshToken) },
    include: { user: true },
  });

  if (!stored || !stored.user) {
    throw new UnauthorizedError(INVALID_REFRESH, 'INVALID_REFRESH_TOKEN');
  }

  if (stored.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { familyId: stored.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new UnauthorizedError(INVALID_REFRESH, 'INVALID_REFRESH_TOKEN');
  }

  if (stored.expiresAt.getTime() <= Date.now()) {
    throw new UnauthorizedError(INVALID_REFRESH, 'INVALID_REFRESH_TOKEN');
  }

  if (stored.user.status !== 'active') {
    throw new ForbiddenError('This account is disabled', 'ACCOUNT_DISABLED');
  }

  const nextToken = generateRefreshToken();
  const created = await prisma.refreshToken.create({
    data: {
      userId: stored.userId,
      tokenHash: nextToken.hash,
      familyId: stored.familyId,
      expiresAt: refreshExpiryDate(),
    },
  });

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date(), replacedById: created.id },
  });

  return {
    token: signAccessToken(stored.user.id, stored.user.tokenVersion),
    refreshToken: nextToken.raw,
    expiresIn: env.JWT_ACCESS_TTL_SECONDS,
    user: toPublicUser(stored.user),
  };
}

export async function logoutUser(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getUserById(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
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
  });
  return users.map((user) => toPublicUser(user));
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

function isNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}
