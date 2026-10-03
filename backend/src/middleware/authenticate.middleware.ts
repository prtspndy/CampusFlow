import { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';
import { asyncHandler } from '../utils/async-handler.js';
import { verifyAccessToken } from '../services/token.service.js';

export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication is required', 'UNAUTHORIZED');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedError('Authentication is required', 'UNAUTHORIZED');
    }

    const claims = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: claims.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        tokenVersion: true,
      },
    });

    if (!user || user.tokenVersion !== claims.tv) {
      throw new UnauthorizedError(
        user ? 'Access token has been revoked' : 'Invalid access token',
        user ? 'TOKEN_REVOKED' : 'UNAUTHORIZED',
      );
    }

    if (user.status !== 'active') {
      throw new ForbiddenError('This account is disabled', 'ACCOUNT_DISABLED');
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      tokenVersion: user.tokenVersion,
    };
    next();
  },
);
