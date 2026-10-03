import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';
import { prisma } from '../src/lib/prisma.js';
import {
  insertUser,
  expireRefreshTokens,
  installPrismaMemory,
  memoryRefreshTokens,
  memoryUsers,
  resetMemoryDb,
  setUserStatus,
} from './helpers/memory-prisma.js';

const password = 'Password1';

/**
 * These tests exercise the real Express app, Zod validation, bcrypt, and JWT verification.
 * Prisma persistence is an in-memory fake. They do not connect to Neon or any other database.
 */
describe('Authentication and authorization', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetMemoryDb();
    installPrismaMemory();
  });

  describe('POST /api/auth/register', () => {
    it('registers a member and stores a password hash', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: '  Ada Lovelace  ',
        email: '  Ada@Campus.edu  ',
        password,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        email: 'ada@campus.edu',
        name: 'Ada Lovelace',
        role: 'member',
        status: 'active',
      });
      expect(res.body.data.passwordHash).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain(password);

      const stored = memoryUsers()[0];
      expect(stored?.passwordHash).toBeDefined();
      expect(stored?.passwordHash).not.toBe(password);
      expect(stored?.role).toBe('member');
      await expect(bcrypt.compare(password, stored?.passwordHash ?? '')).resolves.toBe(true);
    });

    it('rejects invalid input', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: '',
        email: 'not-an-email',
        password: 'short',
      });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(memoryUsers()).toHaveLength(0);
    });

    it('rejects a duplicate email without leaking the stored account', async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Ada',
        email: 'ada@campus.edu',
        password,
      });

      const res = await request(app).post('/api/auth/register').send({
        name: 'Ada Two',
        email: 'ADA@campus.edu',
        password: 'Password2',
      });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toBe('An account with this email already exists');
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
      expect(memoryUsers()).toHaveLength(1);
    });

    it('rejects a privileged role instead of assigning it', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Ada',
        email: 'ada@campus.edu',
        password,
        role: 'admin',
      });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(memoryUsers()).toHaveLength(0);
    });

    it('maps a unique-constraint race to the same conflict response', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);
      vi.spyOn(prisma.user, 'create').mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '6.4.1',
        }),
      );

      const res = await request(app).post('/api/auth/register').send({
        name: 'Ada',
        email: 'ada@campus.edu',
        password,
      });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('POST /api/auth/login', () => {
    it('signs in with a bearer token that omits personal data', async () => {
      await registerMember('ada@campus.edu');

      const res = await request(app).post('/api/auth/login').send({
        email: 'ada@campus.edu',
        password,
        role: 'admin',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('member');
      expect(res.body.data.expiresIn).toBe(env.JWT_ACCESS_TTL_SECONDS);
      expect(res.body.data.refreshToken).toEqual(expect.any(String));
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');

      const decoded = jwt.verify(res.body.data.token, env.JWT_ACCESS_SECRET, {
        algorithms: ['HS256'],
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
      });
      expect(decoded).toMatchObject({ typ: 'access', tv: 0 });
      expect(JSON.stringify(decoded)).not.toContain('ada@campus.edu');
      expect(JSON.stringify(decoded)).not.toContain(password);

      const stored = memoryRefreshTokens()[0];
      expect(stored?.tokenHash).not.toBe(res.body.data.refreshToken);
    });

    it('returns the same error for an unknown account, a wrong password, and a disabled account', async () => {
      await registerMember('ada@campus.edu');
      const passwordHash = await bcrypt.hash(password, 4);
      insertUser({
        email: 'off@campus.edu',
        name: 'Off',
        passwordHash,
        status: 'disabled',
      });

      const unknown = await request(app).post('/api/auth/login').send({
        email: 'missing@campus.edu',
        password,
      });
      const wrong = await request(app).post('/api/auth/login').send({
        email: 'ada@campus.edu',
        password: 'Password2',
      });
      const disabled = await request(app).post('/api/auth/login').send({
        email: 'off@campus.edu',
        password,
      });

      expect(unknown.status).toBe(401);
      expect(wrong.status).toBe(401);
      expect(disabled.status).toBe(401);
      expect(wrong.body.error).toEqual(unknown.body.error);
      expect(disabled.body.error).toEqual(unknown.body.error);
      expect(unknown.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(JSON.stringify(disabled.body)).not.toContain('disabled');
      expect(disabled.body.data).toBeUndefined();
    });

    it('rejects a malformed body', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'ada@campus.edu' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects a disabled account with the same response as a wrong password', async () => {
      const passwordHash = await bcrypt.hash(password, 4);
      insertUser({
        email: 'ada@campus.edu',
        name: 'Ada',
        passwordHash,
        status: 'disabled',
      });

      const disabled = await request(app).post('/api/auth/login').send({
        email: 'ada@campus.edu',
        password,
      });
      const wrong = await request(app).post('/api/auth/login').send({
        email: 'ada@campus.edu',
        password: 'Password2',
      });

      expect(disabled.status).toBe(401);
      expect(disabled.body).toEqual(wrong.body);
      expect(disabled.body.error.message).toBe('Invalid email or password');
    });
  });

  describe('session lifecycle', () => {
    it('refreshes a session and rejects reuse of the previous refresh token', async () => {
      const first = await loginAs('ada@campus.edu');
      const refreshed = await request(app).post('/api/auth/refresh').send({
        refreshToken: first.refreshToken,
      });

      expect(refreshed.status).toBe(200);
      expect(refreshed.body.data.refreshToken).not.toBe(first.refreshToken);

      const me = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${refreshed.body.data.token}`);
      expect(me.status).toBe(200);

      const replay = await request(app).post('/api/auth/refresh').send({
        refreshToken: first.refreshToken,
      });
      expect(replay.status).toBe(401);
      expect(replay.body.error.code).toBe('INVALID_REFRESH_TOKEN');

      const rotatedReplay = await request(app).post('/api/auth/refresh').send({
        refreshToken: refreshed.body.data.refreshToken,
      });
      expect(rotatedReplay.status).toBe(401);
      expect(rotatedReplay.body.error.code).toBe('INVALID_REFRESH_TOKEN');
    });

    it('keeps the presented refresh token when rotation fails to commit', async () => {
      const session = await loginAs('ada@campus.edu');
      const createSpy = vi.mocked(prisma.refreshToken.create);
      const createToken = createSpy.getMockImplementation();
      let failedOnce = false;
      createSpy.mockImplementation(async (args) => {
        if (!failedOnce) {
          failedOnce = true;
          throw new Error('database unavailable');
        }
        if (!createToken) {
          throw new Error('Refresh token create mock is missing');
        }
        return createToken(args);
      });

      const failed = await request(app).post('/api/auth/refresh').send({
        refreshToken: session.refreshToken,
      });

      expect(failed.status).toBe(500);
      expect(failed.body.success).toBe(false);
      expect(JSON.stringify(failed.body)).not.toContain(session.refreshToken);

      const rotated = await request(app).post('/api/auth/refresh').send({
        refreshToken: session.refreshToken,
      });
      expect(rotated.status).toBe(200);
      expect(rotated.body.data.refreshToken).not.toBe(session.refreshToken);
    });

    it('does not issue two live tokens when the same refresh token is used concurrently', async () => {
      const session = await loginAs('ada@campus.edu');
      const [first, second] = await Promise.all([
        request(app).post('/api/auth/refresh').send({ refreshToken: session.refreshToken }),
        request(app).post('/api/auth/refresh').send({ refreshToken: session.refreshToken }),
      ]);

      const statuses = [first.status, second.status].sort();
      expect(statuses).toEqual([200, 401]);
      const active = memoryRefreshTokens().filter((token) => token.revokedAt === null);
      expect(active).toHaveLength(0);

      const winner = first.status === 200 ? first : second;
      const replayWinner = await request(app).post('/api/auth/refresh').send({
        refreshToken: winner.body.data.refreshToken,
      });
      expect(replayWinner.status).toBe(401);
      expect(replayWinner.body.error.code).toBe('INVALID_REFRESH_TOKEN');
    });

    it('rejects an expired refresh token', async () => {
      const session = await loginAs('ada@campus.edu');
      expireRefreshTokens();

      const res = await request(app).post('/api/auth/refresh').send({
        refreshToken: session.refreshToken,
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN');
    });

    it('does not sign out when the logout transaction fails', async () => {
      const session = await loginAs('ada@campus.edu');
      vi.spyOn(prisma.refreshToken, 'updateMany').mockRejectedValueOnce(
        new Error('database unavailable'),
      );

      const logout = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${session.token}`);

      expect(logout.status).toBe(500);
      expect(logout.body.success).toBe(false);
      expect(logout.body.error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(JSON.stringify(logout.body)).not.toContain(session.token);
      expect(JSON.stringify(logout.body)).not.toContain(session.refreshToken);

      const me = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${session.token}`);
      expect(me.status).toBe(200);
      expect(memoryRefreshTokens().some((token) => token.revokedAt === null)).toBe(true);
    });

    it('signs out by revoking refresh tokens and the current access token', async () => {
      const session = await loginAs('ada@campus.edu');
      const logout = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${session.token}`);

      expect(logout.status).toBe(200);
      expect(logout.body.data).toBeNull();
      expect(memoryRefreshTokens().every((token) => token.revokedAt instanceof Date)).toBe(true);

      const me = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${session.token}`);
      expect(me.status).toBe(401);
      expect(me.body.error.code).toBe('TOKEN_REVOKED');

      const refresh = await request(app).post('/api/auth/refresh').send({
        refreshToken: session.refreshToken,
      });
      expect(refresh.status).toBe(401);
    });

    it('rejects missing, malformed, and expired access tokens', async () => {
      const missing = await request(app).get('/api/auth/me');
      expect(missing.status).toBe(401);
      expect(missing.body.error.code).toBe('UNAUTHORIZED');

      const malformed = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not-a-token');
      expect(malformed.status).toBe(401);
      expect(malformed.body.error.code).toBe('UNAUTHORIZED');

      const session = await loginAs('ada@campus.edu');
      const expired = jwt.sign(
        {
          sub: session.user.id,
          tv: 0,
          typ: 'access',
          exp: Math.floor(Date.now() / 1000) - 10,
        },
        env.JWT_ACCESS_SECRET,
        { algorithm: 'HS256', issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE },
      );
      const expiredRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expired}`);
      expect(expiredRes.status).toBe(401);
      expect(expiredRes.body.error.code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('profile and authorization', () => {
    it('returns and updates only the authenticated profile', async () => {
      const ada = await loginAs('ada@campus.edu');
      const grace = await loginAs('grace@campus.edu', 'Grace Hopper');

      const own = await request(app)
        .get(`/api/users/${ada.user.id}`)
        .set('Authorization', `Bearer ${ada.token}`);
      expect(own.status).toBe(200);
      expect(own.body.data.email).toBe('ada@campus.edu');

      const other = await request(app)
        .get(`/api/users/${grace.user.id}`)
        .set('Authorization', `Bearer ${ada.token}`);
      expect(other.status).toBe(403);
      expect(other.body.error.code).toBe('FORBIDDEN');

      const updated = await request(app)
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${ada.token}`)
        .send({ name: 'Ada Updated' });
      expect(updated.status).toBe(200);
      expect(updated.body.data.name).toBe('Ada Updated');
      expect(updated.body.data.role).toBe('member');

      const escalation = await request(app)
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${ada.token}`)
        .send({ name: 'Ada Admin', role: 'admin' });
      expect(escalation.status).toBe(422);
      expect(memoryUsers().find((user) => user.email === 'ada@campus.edu')?.role).toBe('member');
    });

    it('lets an admin read another profile and list users', async () => {
      const member = await loginAs('ada@campus.edu');
      const passwordHash = await bcrypt.hash(password, 4);
      const admin = insertUser({
        email: 'lead@campus.edu',
        name: 'Lead',
        passwordHash,
        role: 'admin',
      });
      const adminLogin = await request(app).post('/api/auth/login').send({
        email: admin.email,
        password,
      });

      const profile = await request(app)
        .get(`/api/users/${member.user.id}`)
        .set('Authorization', `Bearer ${adminLogin.body.data.token}`);
      expect(profile.status).toBe(200);
      expect(profile.body.data.email).toBe('ada@campus.edu');

      const list = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminLogin.body.data.token}`);
      expect(list.status).toBe(200);
      expect(list.body.data.users.length).toBeGreaterThanOrEqual(2);
      expect(JSON.stringify(list.body)).not.toContain('passwordHash');
      expect(JSON.stringify(list.body)).not.toContain('tokenVersion');
    });

    it('blocks ordinary roles from the admin directory', async () => {
      const member = await loginAs('ada@campus.edu');
      const treasurerHash = await bcrypt.hash(password, 4);
      insertUser({
        email: 'treasurer@campus.edu',
        name: 'Treasurer',
        passwordHash: treasurerHash,
        role: 'treasurer',
      });
      const treasurer = await request(app).post('/api/auth/login').send({
        email: 'treasurer@campus.edu',
        password,
      });

      const memberRes = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${member.token}`);
      const treasurerRes = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${treasurer.body.data.token}`);

      expect(memberRes.status).toBe(403);
      expect(treasurerRes.status).toBe(403);
    });

    it('rejects refresh for a disabled account without revealing the account status', async () => {
      const session = await loginAs('ada@campus.edu');
      setUserStatus('ada@campus.edu', 'disabled');

      const res = await request(app).post('/api/auth/refresh').send({
        refreshToken: session.refreshToken,
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN');
      expect(res.body.error.message).toBe('Invalid or expired refresh token');
      expect(JSON.stringify(res.body)).not.toContain('disabled');
    });
  });
});

async function registerMember(email: string, name = 'Ada Lovelace'): Promise<void> {
  const res = await request(app).post('/api/auth/register').send({ name, email, password });
  expect(res.status).toBe(201);
}

async function loginAs(email: string, name = 'Ada Lovelace') {
  await registerMember(email, name);
  const res = await request(app).post('/api/auth/login').send({ email, password });
  expect(res.status).toBe(200);
  return res.body.data as {
    token: string;
    refreshToken: string;
    user: { id: string; email: string; role: string };
  };
}
