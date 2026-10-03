import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { MembershipStatus } from '@prisma/client';
import { app } from '../src/app.js';
import {
  insertUser,
  insertMembership,
  installPrismaMemory,
  resetMemoryDb,
  memoryMemberships,
} from './helpers/memory-prisma.js';

const password = 'Password1';

describe('Membership Management Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetMemoryDb();
    installPrismaMemory();
  });

  async function createTestUser(
    email: string,
    role: 'member' | 'volunteer' | 'door_staff' | 'treasurer' | 'admin' = 'member',
  ) {
    const passwordHash = await bcrypt.hash(password, 4);
    const user = insertUser({
      email,
      name: `User ${email.split('@')[0]}`,
      passwordHash,
      role,
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

  describe('POST /api/memberships (Apply)', () => {
    it('allows authenticated member to apply for membership', async () => {
      const { user, token } = await createTestUser('alice@campus.edu');

      const res = await request(app)
        .post('/api/memberships')
        .set('Authorization', `Bearer ${token}`)
        .send({
          planName: 'annual',
          notes: 'Computer science major',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        userId: user.id,
        planName: 'annual',
        status: MembershipStatus.PENDING,
        renewalCount: 0,
      });
      expect(res.body.data.perks).toBeInstanceOf(Array);
      expect(res.body.data.perks.length).toBeGreaterThan(0);
      expect(memoryMemberships()).toHaveLength(1);
    });

    it('supports POST /api/memberships/apply alias', async () => {
      const { token } = await createTestUser('alias@campus.edu');

      const res = await request(app)
        .post('/api/memberships/apply')
        .set('Authorization', `Bearer ${token}`)
        .send({
          planName: 'semester',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.planName).toBe('semester');
    });

    it('rejects unauthenticated membership application', async () => {
      const res = await request(app).post('/api/memberships').send({
        planName: 'annual',
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects invalid plan names', async () => {
      const { token } = await createTestUser('bob@campus.edu');

      const res = await request(app)
        .post('/api/memberships')
        .set('Authorization', `Bearer ${token}`)
        .send({
          planName: 'unlimited_gold',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('prevents duplicate active or pending membership applications', async () => {
      const { token } = await createTestUser('charlie@campus.edu');

      const firstRes = await request(app)
        .post('/api/memberships')
        .set('Authorization', `Bearer ${token}`)
        .send({ planName: 'annual' });
      expect(firstRes.status).toBe(201);

      const secondRes = await request(app)
        .post('/api/memberships')
        .set('Authorization', `Bearer ${token}`)
        .send({ planName: 'semester' });
      expect(secondRes.status).toBe(400);
      expect(secondRes.body.error.message).toContain('active or pending membership');
    });
  });

  describe('GET /api/memberships/me', () => {
    it('returns own membership records for authenticated user', async () => {
      const { user, token } = await createTestUser('diana@campus.edu');

      insertMembership({
        userId: user.id,
        planName: 'annual',
        status: MembershipStatus.ACTIVE,
      });

      const res = await request(app)
        .get('/api/memberships/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].planName).toBe('annual');
    });
  });

  describe('GET /api/memberships (Staff Listing)', () => {
    it('allows admin to list memberships with pagination', async () => {
      const { token: adminToken } = await createTestUser('admin@campus.edu', 'admin');
      const { user: memberUser } = await createTestUser('member1@campus.edu');

      insertMembership({
        userId: memberUser.id,
        planName: 'annual',
        status: MembershipStatus.ACTIVE,
      });

      const res = await request(app)
        .get('/api/memberships?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.memberships).toHaveLength(1);
      expect(res.body.data.pagination.total).toBe(1);
    });

    it('allows treasurer to list memberships', async () => {
      const { token: treasurerToken } = await createTestUser('treasurer@campus.edu', 'treasurer');

      const res = await request(app)
        .get('/api/memberships')
        .set('Authorization', `Bearer ${treasurerToken}`);

      expect(res.status).toBe(200);
    });

    it('forbids regular members from listing all memberships', async () => {
      const { token } = await createTestUser('regular@campus.edu', 'member');

      const res = await request(app)
        .get('/api/memberships')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/memberships/:membershipId', () => {
    it('allows owner to fetch their membership by id', async () => {
      const { user, token } = await createTestUser('owner@campus.edu');
      const membership = insertMembership({
        userId: user.id,
        planName: 'semester',
        status: MembershipStatus.ACTIVE,
      });

      const res = await request(app)
        .get(`/api/memberships/${membership.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(membership.id);
    });

    it("forbids other non-privileged users from reading someone else's membership", async () => {
      const { user: userA } = await createTestUser('usera@campus.edu');
      const { token: tokenB } = await createTestUser('userb@campus.edu');

      const membershipA = insertMembership({
        userId: userA.id,
        planName: 'semester',
        status: MembershipStatus.ACTIVE,
      });

      const res = await request(app)
        .get(`/api/memberships/${membershipA.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('POST /api/memberships/:membershipId/renew', () => {
    it('renews an existing active membership and increments renewal count', async () => {
      const { user, token } = await createTestUser('renewer@campus.edu');
      const initialDate = new Date(Date.now() + 10 * 24 * 3600 * 1000);
      const membership = insertMembership({
        userId: user.id,
        planName: 'annual',
        status: MembershipStatus.ACTIVE,
        validUntil: initialDate,
      });

      const res = await request(app)
        .post(`/api/memberships/${membership.id}/renew`)
        .set('Authorization', `Bearer ${token}`)
        .send({ planName: 'annual' });

      expect(res.status).toBe(200);
      expect(res.body.data.renewalCount).toBe(1);
      expect(res.body.data.status).toBe(MembershipStatus.ACTIVE);
      expect(new Date(res.body.data.validUntil).getTime()).toBeGreaterThan(initialDate.getTime());
    });
  });

  describe('PATCH /api/memberships/:membershipId/status (State Machine)', () => {
    it('allows admin to transition PENDING -> ACTIVE with admin notes', async () => {
      const { token: adminToken } = await createTestUser('admin2@campus.edu', 'admin');
      const { user } = await createTestUser('applicant@campus.edu');
      const membership = insertMembership({
        userId: user.id,
        planName: 'annual',
        status: MembershipStatus.PENDING,
      });

      const res = await request(app)
        .patch(`/api/memberships/${membership.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'ACTIVE',
          adminNotes: 'Application approved upon verification',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(MembershipStatus.ACTIVE);
      expect(res.body.data.adminNotes).toBe('Application approved upon verification');
    });

    it('rejects invalid state machine transitions with HTTP 400', async () => {
      const { token: adminToken } = await createTestUser('admin3@campus.edu', 'admin');
      const { user } = await createTestUser('applicant2@campus.edu');
      const membership = insertMembership({
        userId: user.id,
        planName: 'annual',
        status: MembershipStatus.PENDING,
      });

      // PENDING cannot transition directly to SUSPENDED
      const res = await request(app)
        .patch(`/api/memberships/${membership.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'SUSPENDED',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Invalid membership status transition');
    });

    it('forbids normal members from updating status', async () => {
      const { token } = await createTestUser('regular2@campus.edu', 'member');
      const membership = insertMembership({
        userId: 'some-id',
        planName: 'annual',
        status: MembershipStatus.PENDING,
      });

      const res = await request(app)
        .patch(`/api/memberships/${membership.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'ACTIVE',
        });

      expect(res.status).toBe(403);
    });
  });
});
