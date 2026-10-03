import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import {
  insertUser,
  installPrismaMemory,
  resetMemoryDb,
  memoryUsers,
} from './helpers/memory-prisma.js';
import { ROLE_PERMISSIONS, ROLE_DISPLAY_NAMES, UserRole } from '../src/types/auth.js';

const password = 'Password1';

describe('Four-Role RBAC Backend Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetMemoryDb();
    installPrismaMemory();
  });

  async function createTestAccount(email: string, role: UserRole) {
    const passwordHash = await bcrypt.hash(password, 4);
    const user = insertUser({
      email,
      name: `User ${email.split('@')[0]}`,
      passwordHash,
      role,
      status: 'active',
      tokenVersion: 0,
    });

    const loginRes = await request(app).post('/api/auth/login').send({
      email,
      password,
    });

    return {
      user,
      token: loginRes.body.data.token as string,
    };
  }

  describe('User profile & login payload includes RBAC fields', () => {
    it('returns canonical role, roleDisplayName, and permissions array on login and /me', async () => {
      const { token } = await createTestAccount('treasurer@campus.edu', 'TREASURER');

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.data).toMatchObject({
        role: 'TREASURER',
        roleDisplayName: ROLE_DISPLAY_NAMES.TREASURER,
      });
      expect(Array.isArray(meRes.body.data.permissions)).toBe(true);
      expect(meRes.body.data.permissions).toEqual(expect.arrayContaining(ROLE_PERMISSIONS.TREASURER as unknown as string[]));
      expect(meRes.body.data.permissions).not.toContain('users.assign_roles');
    });
  });

  describe('Route-level RBAC enforcement across 4 roles', () => {
    it('rejects unauthenticated calls with 401', async () => {
      const res = await request(app).get('/api/admin/users');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects MEMBER from accessing admin user list and role assignment with 403', async () => {
      const member = await createTestAccount('member@campus.edu', 'MEMBER');

      const listRes = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${member.token}`);
      expect(listRes.status).toBe(403);
      expect(listRes.body.error.code).toBe('FORBIDDEN');

      const assignRes = await request(app)
        .patch(`/api/admin/users/${member.user.id}/role`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({ role: 'ADMIN' });
      expect(assignRes.status).toBe(403);
      expect(assignRes.body.error.code).toBe('FORBIDDEN');
    });

    it('rejects EVENT_MANAGER from assigning roles', async () => {
      const em = await createTestAccount('em@campus.edu', 'EVENT_MANAGER');

      const assignRes = await request(app)
        .patch(`/api/admin/users/${em.user.id}/role`)
        .set('Authorization', `Bearer ${em.token}`)
        .send({ role: 'ADMIN' });
      expect(assignRes.status).toBe(403);
      expect(assignRes.body.error.code).toBe('FORBIDDEN');
    });

    it('rejects TREASURER from assigning roles but allows viewing memberships', async () => {
      const treasurer = await createTestAccount('treasurer@campus.edu', 'TREASURER');

      const assignRes = await request(app)
        .patch(`/api/admin/users/${treasurer.user.id}/role`)
        .set('Authorization', `Bearer ${treasurer.token}`)
        .send({ role: 'ADMIN' });
      expect(assignRes.status).toBe(403);
      expect(assignRes.body.error.code).toBe('FORBIDDEN');

      const membershipsRes = await request(app)
        .get('/api/memberships')
        .set('Authorization', `Bearer ${treasurer.token}`);
      expect(membershipsRes.status).toBe(200);
    });

    it('allows ADMIN to list users and assign roles', async () => {
      const admin = await createTestAccount('admin1@campus.edu', 'ADMIN');
      const target = await createTestAccount('target@campus.edu', 'MEMBER');

      const listRes = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${admin.token}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.users).toBeInstanceOf(Array);

      const updateRes = await request(app)
        .patch(`/api/admin/users/${target.user.id}/role`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ role: 'EVENT_MANAGER' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.user.role).toBe('EVENT_MANAGER');
      expect(updateRes.body.data.user.roleDisplayName).toBe(ROLE_DISPLAY_NAMES.EVENT_MANAGER);
    });
  });

  describe('Last Admin Protection and Token Invalidation', () => {
    it('prevents demoting the last active administrator with 400', async () => {
      const soleAdmin = await createTestAccount('solo@campus.edu', 'ADMIN');

      const demoteRes = await request(app)
        .patch(`/api/admin/users/${soleAdmin.user.id}/role`)
        .set('Authorization', `Bearer ${soleAdmin.token}`)
        .send({ role: 'MEMBER' });

      expect(demoteRes.status).toBe(400);
      expect(demoteRes.body.error.message).toContain('Cannot demote or change the role of the last active administrator');

      // Admin role must remain intact
      const freshUser = memoryUsers().find((u) => u.id === soleAdmin.user.id);
      expect(freshUser?.role).toBe('ADMIN');
    });

    it('allows demoting an admin if another active admin exists', async () => {
      const admin1 = await createTestAccount('admin1@campus.edu', 'ADMIN');
      const admin2 = await createTestAccount('admin2@campus.edu', 'ADMIN');

      const demoteRes = await request(app)
        .patch(`/api/admin/users/${admin2.user.id}/role`)
        .set('Authorization', `Bearer ${admin1.token}`)
        .send({ role: 'MEMBER' });

      expect(demoteRes.status).toBe(200);
      expect(demoteRes.body.data.user.role).toBe('MEMBER');
    });

    it('invalidates existing access tokens when a user role is changed', async () => {
      const admin = await createTestAccount('admin@campus.edu', 'ADMIN');
      const member = await createTestAccount('victim@campus.edu', 'MEMBER');

      // Before role change: member's access token works
      const beforeRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${member.token}`);
      expect(beforeRes.status).toBe(200);

      // Admin promotes member to TREASURER
      const roleChangeRes = await request(app)
        .patch(`/api/admin/users/${member.user.id}/role`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ role: 'TREASURER' });
      expect(roleChangeRes.status).toBe(200);

      // Old token must now be rejected because tokenVersion changed
      const afterRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${member.token}`);
      expect(afterRes.status).toBe(401);
      expect(afterRes.body.error.code).toBe('TOKEN_REVOKED');
    });
  });
});
