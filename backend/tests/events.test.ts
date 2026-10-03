import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { EventStatus } from '@prisma/client';
import { app } from '../src/app.js';
import {
  insertUser,
  insertEvent,
  installPrismaMemory,
  resetMemoryDb,
  memoryEvents,
} from './helpers/memory-prisma.js';

const password = 'Password1';

describe('Events Management Suite', () => {
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

  const validEventData = {
    title: 'Campus Hackathon 2026',
    description: 'A 24-hour collaborative coding event open to all students.',
    category: 'Technology',
    venue: 'Student Activities Complex, Room 101',
    startsAt: new Date(Date.now() + 86400000).toISOString(),
    endsAt: new Date(Date.now() + 172800000).toISOString(),
    capacity: 100,
    price: 0,
    status: 'DRAFT',
  };

  describe('POST /api/events (Creation)', () => {
    it('allows volunteer / organizer to create a draft event', async () => {
      const { user, token } = await createTestUser('volunteer@campus.edu', 'volunteer');

      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send(validEventData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        title: validEventData.title,
        status: EventStatus.DRAFT,
        organizerId: user.id,
      });
      expect(memoryEvents()).toHaveLength(1);
    });

    it('forbids standard members from creating events', async () => {
      const { token } = await createTestUser('member@campus.edu', 'member');

      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send(validEventData);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('rejects event where endsAt is before startsAt', async () => {
      const { token } = await createTestUser('organizer@campus.edu', 'volunteer');

      const invalidDates = {
        ...validEventData,
        startsAt: new Date(Date.now() + 172800000).toISOString(),
        endsAt: new Date(Date.now() + 86400000).toISOString(),
      };

      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidDates);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects missing or too short title', async () => {
      const { token } = await createTestUser('organizer2@campus.edu', 'volunteer');

      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validEventData, title: 'Hi' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/events (Public vs Draft Access)', () => {
    it('returns only PUBLISHED events to unauthenticated public callers', async () => {
      const { user } = await createTestUser('staff@campus.edu', 'admin');

      insertEvent({
        title: 'Published Music Night',
        description: 'An evening of live campus student band music and performances.',
        category: 'Entertainment',
        venue: 'Auditorium',
        startsAt: new Date(Date.now() + 100000),
        endsAt: new Date(Date.now() + 200000),
        capacity: 200,
        status: EventStatus.PUBLISHED,
        organizerId: user.id,
      });

      insertEvent({
        title: 'Draft Secret Meeting',
        description: 'Internal planning meeting for upcoming board elections.',
        category: 'Planning',
        venue: 'Room 404',
        startsAt: new Date(Date.now() + 100000),
        endsAt: new Date(Date.now() + 200000),
        capacity: 10,
        status: EventStatus.DRAFT,
        organizerId: user.id,
      });

      const res = await request(app).get('/api/events');

      expect(res.status).toBe(200);
      expect(res.body.data.events).toHaveLength(1);
      expect(res.body.data.events[0].title).toBe('Published Music Night');
    });

    it('allows staff with events:read:drafts to view draft events', async () => {
      const { user, token: adminToken } = await createTestUser('admin_viewer@campus.edu', 'admin');

      insertEvent({
        title: 'Draft Secret Meeting',
        description: 'Internal planning meeting for upcoming board elections.',
        category: 'Planning',
        venue: 'Room 404',
        startsAt: new Date(Date.now() + 100000),
        endsAt: new Date(Date.now() + 200000),
        capacity: 10,
        status: EventStatus.DRAFT,
        organizerId: user.id,
      });

      const res = await request(app)
        .get('/api/events?status=DRAFT')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.events).toHaveLength(1);
      expect(res.body.data.events[0].title).toBe('Draft Secret Meeting');
    });
  });

  describe('GET /api/events/:eventId', () => {
    it('allows anyone to view details of a PUBLISHED event', async () => {
      const { user } = await createTestUser('host@campus.edu', 'volunteer');

      const pubEvent = insertEvent({
        title: 'Campus Open Fair',
        description: 'Explore campus clubs, societies, and community resources.',
        category: 'Fair',
        venue: 'Quad',
        startsAt: new Date(Date.now() + 100000),
        endsAt: new Date(Date.now() + 200000),
        capacity: 500,
        status: EventStatus.PUBLISHED,
        organizerId: user.id,
      });

      const res = await request(app).get(`/api/events/${pubEvent.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(pubEvent.id);
    });

    it('forbids unauthenticated caller from viewing DRAFT event', async () => {
      const { user } = await createTestUser('host2@campus.edu', 'volunteer');

      const draftEvent = insertEvent({
        title: 'Draft Unreleased Event',
        description: 'Unpublished draft description for staff review.',
        category: 'Internal',
        venue: 'Conference Room',
        startsAt: new Date(Date.now() + 100000),
        endsAt: new Date(Date.now() + 200000),
        capacity: 20,
        status: EventStatus.DRAFT,
        organizerId: user.id,
      });

      const res = await request(app).get(`/api/events/${draftEvent.id}`);

      expect(res.status).toBe(404);
    });

    it('allows the creator to view their own DRAFT event', async () => {
      const { user, token } = await createTestUser('host3@campus.edu', 'volunteer');

      const draftEvent = insertEvent({
        title: 'My Draft Event',
        description: 'Detailed description for upcoming campus workshop.',
        category: 'Workshop',
        venue: 'Lab A',
        startsAt: new Date(Date.now() + 100000),
        endsAt: new Date(Date.now() + 200000),
        capacity: 30,
        status: EventStatus.DRAFT,
        organizerId: user.id,
      });

      const res = await request(app)
        .get(`/api/events/${draftEvent.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(draftEvent.id);
    });
  });

  describe('PATCH, Publish, and Cancel Event Lifecycle', () => {
    it('allows creator to update their event details', async () => {
      const { user, token } = await createTestUser('updater@campus.edu', 'volunteer');

      const event = insertEvent({
        title: 'Initial Title',
        description: 'Initial event description meeting length standards.',
        category: 'Social',
        venue: 'Old Hall',
        startsAt: new Date(Date.now() + 100000),
        endsAt: new Date(Date.now() + 200000),
        capacity: 50,
        status: EventStatus.DRAFT,
        organizerId: user.id,
      });

      const res = await request(app)
        .patch(`/api/events/${event.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Event Title',
          venue: 'New Main Auditorium',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Event Title');
      expect(res.body.data.venue).toBe('New Main Auditorium');
    });

    it('forbids another regular user from updating the event', async () => {
      const { user: creator } = await createTestUser('creator@campus.edu', 'volunteer');
      const { token: otherToken } = await createTestUser('other@campus.edu', 'volunteer');

      const event = insertEvent({
        title: 'Creator Event',
        description: 'Initial description that passes validation rules.',
        category: 'Social',
        venue: 'Hall',
        startsAt: new Date(Date.now() + 100000),
        endsAt: new Date(Date.now() + 200000),
        capacity: 50,
        status: EventStatus.DRAFT,
        organizerId: creator.id,
      });

      const res = await request(app)
        .patch(`/api/events/${event.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Hijacked Event Title' });

      expect(res.status).toBe(403);
    });

    it('transitions DRAFT -> PUBLISHED when publish endpoint is called', async () => {
      const { user, token } = await createTestUser('publisher@campus.edu', 'volunteer');

      const event = insertEvent({
        title: 'Ready Event',
        description: 'Ready to be announced and published to general campus.',
        category: 'Social',
        venue: 'Main Lounge',
        startsAt: new Date(Date.now() + 100000),
        endsAt: new Date(Date.now() + 200000),
        capacity: 80,
        status: EventStatus.DRAFT,
        organizerId: user.id,
      });

      const res = await request(app)
        .post(`/api/events/${event.id}/publish`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(EventStatus.PUBLISHED);
    });

    it('transitions to CANCELLED when cancel endpoint is called', async () => {
      const { user, token } = await createTestUser('canceller@campus.edu', 'volunteer');

      const event = insertEvent({
        title: 'Storm Event',
        description: 'Event that needs to be cancelled due to severe weather.',
        category: 'Outdoor',
        venue: 'Campus Field',
        startsAt: new Date(Date.now() + 100000),
        endsAt: new Date(Date.now() + 200000),
        capacity: 100,
        status: EventStatus.PUBLISHED,
        organizerId: user.id,
      });

      const res = await request(app)
        .post(`/api/events/${event.id}/cancel`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(EventStatus.CANCELLED);
    });
  });
});
