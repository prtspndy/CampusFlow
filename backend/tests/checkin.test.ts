import crypto from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { EventStatus, RegistrationStatus, TicketStatus, TicketTier } from '@prisma/client';
import { app } from '../src/app.js';
import { hashVerificationToken } from '../src/services/ticket-crypto.js';
import {
  insertEvent,
  insertRegistration,
  insertTicket,
  insertUser,
  installPrismaMemory,
  memoryCheckIns,
  memoryTickets,
  resetMemoryDb,
} from './helpers/memory-prisma.js';

const password = 'Password1';

describe('QR tickets and check-in', () => {
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
      capacity: 20,
      price: 0,
      status: EventStatus.PUBLISHED,
      organizerId,
      ...overrides,
    });
  }

  async function issuedTicket() {
    const suffix = crypto.randomUUID().slice(0, 8);
    const organizer = await login(`organizer-${suffix}@campus.edu`, 'EVENT_MANAGER');
    const member = await login(`ada-${suffix}@campus.edu`);
    const event = publishedEvent(organizer.user.id);
    const created = await request(app)
      .post(`/api/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${member.token}`);
    return {
      organizer,
      member,
      event,
      token: created.body.data.ticket.qrToken as string,
      ticketId: created.body.data.ticket.id as string,
    };
  }

  it('validates a ticket and checks it in once', async () => {
    const { organizer, event, token, ticketId, member } = await issuedTicket();

    const preview = await request(app)
      .post(`/api/events/${event.id}/tickets/validate`)
      .set('Authorization', `Bearer ${organizer.token}`)
      .send({ token });
    const checked = await request(app)
      .post(`/api/events/${event.id}/check-in`)
      .set('Authorization', `Bearer ${organizer.token}`)
      .send({ token });
    const attendance = await request(app)
      .get(`/api/events/${event.id}/attendance`)
      .set('Authorization', `Bearer ${organizer.token}`);
    const qr = await request(app)
      .get(`/api/tickets/${ticketId}/qr`)
      .set('Authorization', `Bearer ${member.token}`);

    expect(preview.status).toBe(200);
    expect(preview.body.data.result).toBe('VALID');
    expect(checked.status).toBe(200);
    expect(checked.body.data.result).toBe('CHECKED_IN');
    expect(checked.body.data.ticket.checkedInById).toBe(organizer.user.id);
    expect(attendance.body.data.attendance).toHaveLength(1);
    expect(qr.body.data.qrToken).toBe(token);
    expect(qr.body.data.qrDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(memoryCheckIns()).toHaveLength(1);
    expect(memoryTickets()[0]?.status).toBe(TicketStatus.USED);
  });

  it('rejects a malformed token, an unknown token, and a missing ticket', async () => {
    const { organizer, event } = await issuedTicket();
    const malformed = await request(app)
      .post(`/api/events/${event.id}/check-in`)
      .set('Authorization', `Bearer ${organizer.token}`)
      .send({ token: 'not-a-ticket' });
    const unknown = `cf_${'a'.repeat(43)}`;
    const missing = await request(app)
      .post(`/api/events/${event.id}/check-in`)
      .set('Authorization', `Bearer ${organizer.token}`)
      .send({ token: unknown });
    const validated = await request(app)
      .post(`/api/events/${event.id}/tickets/validate`)
      .set('Authorization', `Bearer ${organizer.token}`)
      .send({ token: unknown });

    expect(malformed.status).toBe(422);
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('TICKET_INVALID');
    expect(validated.status).toBe(200);
    expect(validated.body.data.result).toBe('INVALID');
  });

  it('rejects unpaid, cancelled, and wrong-event tickets', async () => {
    const organizer = await login('organizer@campus.edu', 'EVENT_MANAGER');
    const member = await login('ada@campus.edu');
    const event = publishedEvent(organizer.user.id, { price: 250 });
    const other = publishedEvent(organizer.user.id);
    const unpaidToken = `cf_${'b'.repeat(43)}`;
    const registration = insertRegistration({
      eventId: event.id,
      userId: member.user.id,
      status: RegistrationStatus.PENDING_PAYMENT,
      tier: TicketTier.STANDARD,
      amountPaise: 25000,
    });
    insertTicket({
      registrationId: registration.id,
      eventId: event.id,
      userId: member.user.id,
      status: TicketStatus.ISSUED,
      verificationTokenHash: hashVerificationToken(unpaidToken),
      encryptedVerificationToken: 'unused',
    });

    const unpaid = await request(app)
      .post(`/api/events/${event.id}/check-in`)
      .set('Authorization', `Bearer ${organizer.token}`)
      .send({ token: unpaidToken });

    const issued = await request(app)
      .post(`/api/events/${other.id}/registrations`)
      .set('Authorization', `Bearer ${member.token}`);
    const qrToken = issued.body.data.ticket.qrToken as string;
    await request(app)
      .post(`/api/registrations/${issued.body.data.registration.id}/cancel`)
      .set('Authorization', `Bearer ${member.token}`);
    const cancelled = await request(app)
      .post(`/api/events/${other.id}/check-in`)
      .set('Authorization', `Bearer ${organizer.token}`)
      .send({ token: qrToken });
    const wrongEvent = await request(app)
      .post(`/api/events/${event.id}/check-in`)
      .set('Authorization', `Bearer ${organizer.token}`)
      .send({ token: qrToken });

    expect(unpaid.status).toBe(409);
    expect(unpaid.body.error.code).toBe('TICKET_UNPAID');
    expect(cancelled.status).toBe(409);
    expect(cancelled.body.error.code).toBe('TICKET_CANCELLED');
    expect(wrongEvent.status).toBe(409);
    expect(wrongEvent.body.error.code).toBe('TICKET_EVENT_MISMATCH');
  });

  it('forbids attendees and unrelated staff from checking in', async () => {
    const { member, event, token } = await issuedTicket();
    const outsider = await login('other@campus.edu', 'EVENT_MANAGER');
    const treasurer = await login('treasurer@campus.edu', 'TREASURER');

    const self = await request(app)
      .post(`/api/events/${event.id}/check-in`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({ token });
    const unrelated = await request(app)
      .post(`/api/events/${event.id}/check-in`)
      .set('Authorization', `Bearer ${outsider.token}`)
      .send({ token });
    const finance = await request(app)
      .post(`/api/events/${event.id}/check-in`)
      .set('Authorization', `Bearer ${treasurer.token}`)
      .send({ token });
    const hidden = await request(app)
      .get('/api/tickets/me')
      .set('Authorization', `Bearer ${outsider.token}`);

    expect(self.status).toBe(403);
    expect(unrelated.status).toBe(403);
    expect(finance.status).toBe(403);
    expect(hidden.status).toBe(200);
    expect(hidden.body.data.tickets).toEqual([]);
    expect(memoryCheckIns()).toHaveLength(0);
  });

  it('rejects a duplicate check-in and concurrent check-in attempts', async () => {
    const { organizer, event, token } = await issuedTicket();
    const first = await request(app)
      .post(`/api/events/${event.id}/check-in`)
      .set('Authorization', `Bearer ${organizer.token}`)
      .send({ token });
    const duplicate = await request(app)
      .post(`/api/events/${event.id}/check-in`)
      .set('Authorization', `Bearer ${organizer.token}`)
      .send({ token });

    const second = await issuedTicket();
    const [left, right] = await Promise.all([
      request(app)
        .post(`/api/events/${second.event.id}/check-in`)
        .set('Authorization', `Bearer ${second.organizer.token}`)
        .send({ token: second.token }),
      request(app)
        .post(`/api/events/${second.event.id}/check-in`)
        .set('Authorization', `Bearer ${second.organizer.token}`)
        .send({ token: second.token }),
    ]);

    expect(first.status).toBe(200);
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('ALREADY_CHECKED_IN');
    expect([left.status, right.status].sort()).toEqual([200, 409]);
    expect(memoryCheckIns()).toHaveLength(2);
    expect(memoryTickets().filter((ticket) => ticket.status === TicketStatus.USED)).toHaveLength(2);
  });

  it('does not let another user read a ticket', async () => {
    const { ticketId } = await issuedTicket();
    const other = await login('grace@campus.edu');
    const response = await request(app)
      .get(`/api/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${other.token}`);
    const qr = await request(app)
      .get(`/api/tickets/${ticketId}/qr`)
      .set('Authorization', `Bearer ${other.token}`);

    expect(response.status).toBe(404);
    expect(qr.status).toBe(404);
  });
});
