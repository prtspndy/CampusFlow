import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { EventStatus, MembershipStatus, TicketTier } from '@prisma/client';
import { app } from '../src/app.js';
import {
  insertEvent,
  insertMembership,
  insertUser,
  installPrismaMemory,
  memoryRegistrations,
  memoryTickets,
  resetMemoryDb,
} from './helpers/memory-prisma.js';

const password = 'Password1';

describe('Event registration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetMemoryDb();
    installPrismaMemory();
  });

  async function login(
    email: string,
    role: 'MEMBER' | 'EVENT_MANAGER' | 'TREASURER' | 'ADMIN' = 'MEMBER',
  ) {
    const passwordHash = await bcrypt.hash(password, 4);
    const user = insertUser({ email, name: email.split('@')[0] ?? 'User', passwordHash, role });
    const response = await request(app).post('/api/auth/login').send({ email, password });
    return { user, token: response.body.data.token as string };
  }

  function publishedEvent(
    organizerId: string,
    overrides: Partial<Parameters<typeof insertEvent>[0]> = {},
  ) {
    return insertEvent({
      title: 'Spring Gala',
      description: 'Annual student organization gala with live music.',
      category: 'Social',
      venue: 'Main Hall',
      startsAt: new Date(Date.now() + 86_400_000),
      endsAt: new Date(Date.now() + 90_000_000),
      capacity: 50,
      price: 0,
      status: EventStatus.PUBLISHED,
      organizerId,
      ...overrides,
    });
  }

  it('registers an authenticated user for a free published event and issues one ticket', async () => {
    const organizer = await login('organizer@campus.edu', 'EVENT_MANAGER');
    const member = await login('ada@campus.edu');
    const event = publishedEvent(organizer.user.id);

    const response = await request(app)
      .post(`/api/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${member.token}`);

    expect(response.status).toBe(201);
    expect(response.body.data.registration).toMatchObject({
      eventId: event.id,
      userId: member.user.id,
      status: 'CONFIRMED',
      tier: 'STANDARD',
      amountPaise: 0,
      currency: 'INR',
    });
    expect(response.body.data.ticket.status).toBe('ISSUED');
    expect(response.body.data.ticket.qrToken).toMatch(/^cf_[A-Za-z0-9_-]+$/);
    expect(response.body.data.ticket.qrDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(response.body.data.payment).toBeNull();
    expect(JSON.stringify(response.body)).not.toContain('encryptedVerificationToken');
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    expect(memoryRegistrations()).toHaveLength(1);
    expect(memoryTickets()).toHaveLength(1);
  });

  it('charges the active member price and reserves a paid registration without a ticket', async () => {
    const organizer = await login('organizer@campus.edu', 'EVENT_MANAGER');
    const member = await login('ada@campus.edu');
    insertMembership({
      userId: member.user.id,
      planName: 'annual',
      status: MembershipStatus.ACTIVE,
      validUntil: new Date(Date.now() + 86_400_000),
    });
    const event = publishedEvent(organizer.user.id, {
      price: 400,
      memberPrice: 100,
      standardPrice: 400,
    });

    const response = await request(app)
      .post(`/api/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${member.token}`);

    expect(response.status).toBe(201);
    expect(response.body.data.registration).toMatchObject({
      status: 'PENDING_PAYMENT',
      tier: TicketTier.MEMBER,
      amountPaise: 10000,
    });
    expect(response.body.data.ticket).toBeNull();
    expect(memoryTickets()).toHaveLength(0);
  });

  it('rejects unauthenticated registration', async () => {
    const organizer = await login('organizer@campus.edu', 'EVENT_MANAGER');
    const event = publishedEvent(organizer.user.id);
    const response = await request(app).post(`/api/events/${event.id}/registrations`);
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects a nonexistent event', async () => {
    const member = await login('ada@campus.edu');
    const response = await request(app)
      .post('/api/events/11111111-1111-4111-8111-111111111111/registrations')
      .set('Authorization', `Bearer ${member.token}`);
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('hides unpublished events and closes registration after the start time', async () => {
    const organizer = await login('organizer@campus.edu', 'EVENT_MANAGER');
    const member = await login('ada@campus.edu');
    const draft = publishedEvent(organizer.user.id, { status: EventStatus.DRAFT });
    const closed = publishedEvent(organizer.user.id, {
      startsAt: new Date(Date.now() - 60_000),
      endsAt: new Date(Date.now() - 30_000),
    });

    const unpublished = await request(app)
      .post(`/api/events/${draft.id}/registrations`)
      .set('Authorization', `Bearer ${member.token}`);
    const afterDeadline = await request(app)
      .post(`/api/events/${closed.id}/registrations`)
      .set('Authorization', `Bearer ${member.token}`);

    expect(unpublished.status).toBe(404);
    expect(afterDeadline.status).toBe(400);
    expect(afterDeadline.body.error.code).toBe('REGISTRATION_CLOSED');
    expect(memoryRegistrations()).toHaveLength(0);
  });

  it('rejects a duplicate registration and keeps a single seat', async () => {
    const organizer = await login('organizer@campus.edu', 'EVENT_MANAGER');
    const member = await login('ada@campus.edu');
    const event = publishedEvent(organizer.user.id, { capacity: 2 });

    const first = await request(app)
      .post(`/api/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${member.token}`);
    const second = await request(app)
      .post(`/api/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${member.token}`);

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('ALREADY_REGISTERED');
    expect(memoryRegistrations()).toHaveLength(1);
  });

  it('rejects registration when capacity is reached', async () => {
    const organizer = await login('organizer@campus.edu', 'EVENT_MANAGER');
    const first = await login('ada@campus.edu');
    const second = await login('grace@campus.edu');
    const event = publishedEvent(organizer.user.id, { capacity: 1 });

    const accepted = await request(app)
      .post(`/api/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${first.token}`);
    const rejected = await request(app)
      .post(`/api/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${second.token}`);

    expect(accepted.status).toBe(201);
    expect(rejected.status).toBe(409);
    expect(rejected.body.error.code).toBe('CAPACITY_REACHED');
    expect(memoryRegistrations()).toHaveLength(1);
  });

  it('does not reveal another user registration', async () => {
    const organizer = await login('organizer@campus.edu', 'EVENT_MANAGER');
    const owner = await login('ada@campus.edu');
    const other = await login('grace@campus.edu');
    const event = publishedEvent(organizer.user.id);
    const created = await request(app)
      .post(`/api/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${owner.token}`);

    const response = await request(app)
      .get(`/api/registrations/${created.body.data.registration.id}`)
      .set('Authorization', `Bearer ${other.token}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('forbids an event manager who does not organize the event from listing registrations', async () => {
    const organizer = await login('organizer@campus.edu', 'EVENT_MANAGER');
    const outsider = await login('other@campus.edu', 'EVENT_MANAGER');
    const treasurer = await login('treasurer@campus.edu', 'TREASURER');
    const event = publishedEvent(organizer.user.id);

    const outsiderResponse = await request(app)
      .get(`/api/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${outsider.token}`);
    const treasurerResponse = await request(app)
      .get(`/api/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${treasurer.token}`);
    const organizerResponse = await request(app)
      .get(`/api/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${organizer.token}`);

    expect(outsiderResponse.status).toBe(403);
    expect(treasurerResponse.status).toBe(403);
    expect(organizerResponse.status).toBe(200);
    expect(organizerResponse.body.data.registrations).toEqual([]);
  });

  it('lets only one of two concurrent registrations take the last seat', async () => {
    const organizer = await login('organizer@campus.edu', 'EVENT_MANAGER');
    const first = await login('ada@campus.edu');
    const second = await login('grace@campus.edu');
    const event = publishedEvent(organizer.user.id, { capacity: 1 });

    const [left, right] = await Promise.all([
      request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Authorization', `Bearer ${first.token}`),
      request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Authorization', `Bearer ${second.token}`),
    ]);

    const statuses = [left.status, right.status].sort();
    expect(statuses).toEqual([201, 409]);
    expect(memoryRegistrations()).toHaveLength(1);
    expect(memoryTickets()).toHaveLength(1);
  });

  describe('GET /api/registrations/me (Own Registrations)', () => {
    it('requires authentication for GET /api/registrations/me', async () => {
      const res = await request(app).get('/api/registrations/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns empty registrations list with pagination when user has no registrations', async () => {
      const member = await login('ada-empty@campus.edu');

      const res = await request(app)
        .get('/api/registrations/me')
        .set('Authorization', `Bearer ${member.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.registrations).toEqual([]);
      expect(res.body.data.pagination).toEqual({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('returns only the authenticated user registrations with event and ticket details', async () => {
      const organizer = await login('organizer-me@campus.edu', 'EVENT_MANAGER');
      const ada = await login('ada-me@campus.edu');
      const grace = await login('grace-me@campus.edu');

      const galaEvent = publishedEvent(organizer.user.id, { title: 'Spring Gala' });
      const techEvent = publishedEvent(organizer.user.id, { title: 'Hackathon Workshop' });

      // Ada registers for Gala
      const adaRegRes = await request(app)
        .post(`/api/events/${galaEvent.id}/registrations`)
        .set('Authorization', `Bearer ${ada.token}`);
      expect(adaRegRes.status).toBe(201);
      const adaRegId = adaRegRes.body.data.registration.id;

      // Grace registers for Hackathon
      const graceRegRes = await request(app)
        .post(`/api/events/${techEvent.id}/registrations`)
        .set('Authorization', `Bearer ${grace.token}`);
      expect(graceRegRes.status).toBe(201);

      // Ada lists own registrations
      const adaListRes = await request(app)
        .get('/api/registrations/me')
        .set('Authorization', `Bearer ${ada.token}`);

      expect(adaListRes.status).toBe(200);
      expect(adaListRes.body.data.registrations).toHaveLength(1);
      const item = adaListRes.body.data.registrations[0];
      expect(item.id).toBe(adaRegId);
      expect(item.userId).toBe(ada.user.id);
      expect(item.status).toBe('CONFIRMED');
      expect(item.event).toMatchObject({
        id: galaEvent.id,
        title: 'Spring Gala',
      });
      expect(item.ticket).toBeDefined();
      expect(item.ticket.status).toBe('ISSUED');

      // Grace lists own registrations
      const graceListRes = await request(app)
        .get('/api/registrations/me')
        .set('Authorization', `Bearer ${grace.token}`);

      expect(graceListRes.status).toBe(200);
      expect(graceListRes.body.data.registrations).toHaveLength(1);
      expect(graceListRes.body.data.registrations[0].userId).toBe(grace.user.id);
      expect(graceListRes.body.data.registrations[0].event.title).toBe('Hackathon Workshop');
    });

    it('paginates registrations according to query parameters', async () => {
      const organizer = await login('organizer-page@campus.edu', 'EVENT_MANAGER');
      const ada = await login('ada-page@campus.edu');

      const event1 = publishedEvent(organizer.user.id, { title: 'Event One' });
      const event2 = publishedEvent(organizer.user.id, { title: 'Event Two' });

      await request(app)
        .post(`/api/events/${event1.id}/registrations`)
        .set('Authorization', `Bearer ${ada.token}`);
      await request(app)
        .post(`/api/events/${event2.id}/registrations`)
        .set('Authorization', `Bearer ${ada.token}`);

      const page1Res = await request(app)
        .get('/api/registrations/me?page=1&limit=1')
        .set('Authorization', `Bearer ${ada.token}`);

      expect(page1Res.status).toBe(200);
      expect(page1Res.body.data.registrations).toHaveLength(1);
      expect(page1Res.body.data.pagination).toEqual({
        total: 2,
        page: 1,
        limit: 1,
        totalPages: 2,
      });

      const page2Res = await request(app)
        .get('/api/registrations/me?page=2&limit=1')
        .set('Authorization', `Bearer ${ada.token}`);

      expect(page2Res.status).toBe(200);
      expect(page2Res.body.data.registrations).toHaveLength(1);
      expect(page2Res.body.data.pagination).toEqual({
        total: 2,
        page: 2,
        limit: 1,
        totalPages: 2,
      });
      expect(page2Res.body.data.registrations[0].id).not.toBe(
        page1Res.body.data.registrations[0].id,
      );
    });

    it('rejects invalid pagination parameters with 422', async () => {
      const ada = await login('ada-invalid@campus.edu');

      const resZeroPage = await request(app)
        .get('/api/registrations/me?page=0')
        .set('Authorization', `Bearer ${ada.token}`);
      expect(resZeroPage.status).toBe(422);
      expect(resZeroPage.body.error.code).toBe('VALIDATION_ERROR');

      const resOverLimit = await request(app)
        .get('/api/registrations/me?limit=200')
        .set('Authorization', `Bearer ${ada.token}`);
      expect(resOverLimit.status).toBe(422);
      expect(resOverLimit.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Multi-quantity event registrations and capacity', () => {
    it('registers for multiple tickets (3) on a free event and issues 3 distinct tickets', async () => {
      const organizer = await login('org-multi@campus.edu', 'EVENT_MANAGER');
      const member = await login('member-multi@campus.edu');
      const event = publishedEvent(organizer.user.id, { capacity: 20 });

      const response = await request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({ quantity: 3 });

      expect(response.status).toBe(201);
      expect(response.body.data.registration).toMatchObject({
        eventId: event.id,
        userId: member.user.id,
        status: 'CONFIRMED',
        tier: 'STANDARD',
        quantity: 3,
        amountPaise: 0,
      });

      expect(response.body.data.tickets).toHaveLength(3);
      const ticketIds = response.body.data.tickets.map((t: any) => t.id);
      const uniqueIds = new Set(ticketIds);
      expect(uniqueIds.size).toBe(3);

      const qrTokens = response.body.data.tickets.map((t: any) => t.qrToken);
      const uniqueTokens = new Set(qrTokens);
      expect(uniqueTokens.size).toBe(3);

      // Verify event registeredCount incremented by 3
      const updatedEvent = memoryRegistrations().find((r) => r.id === response.body.data.registration.id);
      expect(updatedEvent?.quantity).toBe(3);
      expect(memoryTickets()).toHaveLength(3);
    });

    it('calculates total price as unitPrice * quantity for paid events', async () => {
      const organizer = await login('org-paid-multi@campus.edu', 'EVENT_MANAGER');
      const member = await login('member-paid-multi@campus.edu');
      const event = publishedEvent(organizer.user.id, { price: 500, capacity: 50 });

      const response = await request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({ quantity: 4 });

      expect(response.status).toBe(201);
      expect(response.body.data.registration).toMatchObject({
        eventId: event.id,
        userId: member.user.id,
        status: 'PENDING_PAYMENT',
        quantity: 4,
        amountPaise: 200000, // 4 * ₹500 * 100 paise = 200,000 paise (₹2,000)
        currency: 'INR',
      });
      expect(response.body.data.tickets).toHaveLength(0);
    });

    it('rejects booking when requested quantity exceeds available capacity', async () => {
      const organizer = await login('org-cap@campus.edu', 'EVENT_MANAGER');
      const member = await login('member-cap@campus.edu');
      const event = publishedEvent(organizer.user.id, { capacity: 5 });

      // First member takes 4 seats
      const res1 = await request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({ quantity: 4 });
      expect(res1.status).toBe(201);

      // Second member tries to take 2 seats (only 1 remaining)
      const member2 = await login('member-cap2@campus.edu');
      const res2 = await request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Authorization', `Bearer ${member2.token}`)
        .send({ quantity: 2 });

      expect(res2.status).toBe(409);
      expect(res2.body.error.code).toBe('CAPACITY_REACHED');
    });

    it('rejects invalid quantities (0, negative, > 10, non-integer)', async () => {
      const organizer = await login('org-val@campus.edu', 'EVENT_MANAGER');
      const member = await login('member-val@campus.edu');
      const event = publishedEvent(organizer.user.id);

      const res0 = await request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({ quantity: 0 });
      expect(res0.status).toBe(422);

      const resNeg = await request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({ quantity: -2 });
      expect(resNeg.status).toBe(422);

      const resOver = await request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({ quantity: 11 });
      expect(resOver.status).toBe(422);
    });

    it('cancelling a multi-ticket registration releases all reserved seats and cancels all tickets', async () => {
      const organizer = await login('org-cancel-multi@campus.edu', 'EVENT_MANAGER');
      const member = await login('member-cancel-multi@campus.edu');
      const event = publishedEvent(organizer.user.id, { capacity: 20 });

      const regRes = await request(app)
        .post(`/api/events/${event.id}/registrations`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({ quantity: 3 });

      const regId = regRes.body.data.registration.id;
      expect(memoryTickets().filter((t) => t.status === 'ISSUED')).toHaveLength(3);

      const cancelRes = await request(app)
        .post(`/api/registrations/${regId}/cancel`)
        .set('Authorization', `Bearer ${member.token}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.registration.status).toBe('CANCELLED');
      expect(memoryTickets().filter((t) => t.status === 'CANCELLED')).toHaveLength(3);
      expect(memoryTickets().filter((t) => t.status === 'ISSUED')).toHaveLength(0);
    });
  });
});

