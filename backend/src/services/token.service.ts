import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../utils/errors.js';

const { TokenExpiredError } = jwt;

interface AccessTokenClaims {
  sub: string;
  tv: number;
}

export function signAccessToken(userId: string, tokenVersion: number): string {
  return jwt.sign({ sub: userId, tv: tokenVersion, typ: 'access' }, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_ACCESS_TTL_SECONDS,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    jwtid: crypto.randomUUID(),
  });
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });

    if (!isAccessPayload(decoded)) {
      throw new UnauthorizedError('Invalid access token', 'UNAUTHORIZED');
    }

    return { sub: decoded.sub, tv: decoded.tv };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    if (error instanceof TokenExpiredError) {
      throw new UnauthorizedError('Access token has expired', 'TOKEN_EXPIRED');
    }
    throw new UnauthorizedError('Invalid access token', 'UNAUTHORIZED');
  }
}

export function generateRefreshToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString('base64url');
  return { raw, hash: hashRefreshToken(raw) };
}

export function hashRefreshToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function refreshExpiryDate(): Date {
  return new Date(Date.now() + env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
}

function isAccessPayload(decoded: string | JwtPayload): decoded is JwtPayload & AccessTokenClaims {
  if (typeof decoded === 'string') {
    return false;
  }
  return (
    decoded.typ === 'access' &&
    typeof decoded.sub === 'string' &&
    decoded.sub.length > 0 &&
    typeof decoded.tv === 'number' &&
    Number.isInteger(decoded.tv)
  );
}
