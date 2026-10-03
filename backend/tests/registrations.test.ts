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
});
