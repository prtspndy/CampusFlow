import crypto from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { EventStatus, PaymentStatus } from '@prisma/client';
import { app } from '../src/app.js';
import {
  createRazorpayOrder,
  fetchRazorpayOrder,
  fetchRazorpayPayment,
} from '../src/lib/razorpay.js';
import {
  insertEvent,
  insertUser,
  installPrismaMemory,
  memoryPayments,
  memoryTickets,
  resetMemoryDb,
} from './helpers/memory-prisma.js';

vi.mock('../src/lib/razorpay.js', async () => {
  const actual =
    await vi.importActual<typeof import('../src/lib/razorpay.js')>('../src/lib/razorpay.js');
  return {
    ...actual,
    createRazorpayOrder: vi.fn(),
    fetchRazorpayOrder: vi.fn(),
    fetchRazorpayPayment: vi.fn(),
  };
});

const password = 'Password1';
const keySecret = 'test-razorpay-key-secret-32chars-min';
const webhookSecret = 'test-razorpay-webhook-secret-32chars';

function signPayment(orderId: string, paymentId: string): string {
  return crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
}

function signWebhook(body: string): string {
  return crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');
}

describe('Razorpay payments', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetMemoryDb();
    installPrismaMemory();
    vi.mocked(createRazorpayOrder).mockImplementation(async (input) => ({
      id: `order_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
      amount: input.amount,
      currency: input.currency,
      status: 'created',
    }));
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

  async function reservedRegistration() {
    const organizer = await login('organizer@campus.edu', 'EVENT_MANAGER');
    const member = await login('ada@campus.edu');
    const event = insertEvent({
      title: 'Spring Gala',
      description: 'Annual student organization gala with live music.',
      category: 'Social',
      venue: 'Main Hall',
      startsAt: new Date(Date.now() + 86_400_000),
      endsAt: new Date(Date.now() + 90_000_000),
      capacity: 20,
      price: 250,
      status: EventStatus.PUBLISHED,
      organizerId: organizer.user.id,
    });
    const registration = await request(app)
      .post(`/api/events/${event.id}/registrations`)
      .set('Authorization', `Bearer ${member.token}`);
    return { organizer, member, event, registration: registration.body.data.registration };
  }

  function mockProvider(
    orderId: string,
    paymentId: string,
    amount: number,
    status: string,
    currency = 'INR',
  ) {
    vi.mocked(fetchRazorpayPayment).mockResolvedValue({
      id: paymentId,
      order_id: orderId,
      amount,
      currency,
      status,
    });
    vi.mocked(fetchRazorpayOrder).mockResolvedValue({
      id: orderId,
      amount,
      currency,
      status: status === 'captured' ? 'paid' : status,
    });
  }

  async function createOrder(token: string, registrationId: string) {
    return request(app)
      .post(`/api/registrations/${registrationId}/payment-order`)
      .set('Authorization', `Bearer ${token}`);
  }

  it('verifies a captured payment and issues exactly one ticket', async () => {
    const { member, registration } = await reservedRegistration();
    const order = await createOrder(member.token, registration.id);
    expect(order.status).toBe(201);
    expect(order.body.data.payment.keyId).toBe('rzp_test_campusflow');
    expect(JSON.stringify(order.body)).not.toContain(keySecret);

    const orderId = order.body.data.payment.razorpayOrderId as string;
    const paymentId = 'pay_captured_1';
    mockProvider(orderId, paymentId, 25000, 'captured');

    const verified = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signPayment(orderId, paymentId),
      });

    expect(verified.status).toBe(200);
    expect(verified.body.data.payment.status).toBe('PAID');
    expect(verified.body.data.registration.status).toBe('CONFIRMED');
    expect(verified.body.data.ticket.qrToken).toMatch(/^cf_/);
    expect(memoryTickets()).toHaveLength(1);
    expect(memoryPayments()).toHaveLength(1);
  });

  it('rejects an invalid signature without changing the payment', async () => {
    const { member, registration } = await reservedRegistration();
    const order = await createOrder(member.token, registration.id);
    const orderId = order.body.data.payment.razorpayOrderId as string;

    const response = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: 'pay_bad',
        razorpay_signature: 'deadbeef',
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_SIGNATURE');
    expect(memoryPayments()[0]?.status).toBe(PaymentStatus.CREATED);
    expect(memoryTickets()).toHaveLength(0);
  });

  it('rejects an unknown order, another user, and an amount or currency mismatch', async () => {
    const { member, registration } = await reservedRegistration();
    const other = await login('grace@campus.edu');
    const order = await createOrder(member.token, registration.id);
    const orderId = order.body.data.payment.razorpayOrderId as string;
    const paymentId = 'pay_mismatch';

    const unknown = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        razorpay_order_id: 'order_missing',
        razorpay_payment_id: paymentId,
        razorpay_signature: signPayment('order_missing', paymentId),
      });
    const foreign = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${other.token}`)
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signPayment(orderId, paymentId),
      });

    mockProvider(orderId, paymentId, 100, 'captured');
    const amount = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signPayment(orderId, paymentId),
      });

    mockProvider(orderId, paymentId, 25000, 'captured', 'USD');
    const currency = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signPayment(orderId, paymentId),
      });

    expect(unknown.status).toBe(404);
    expect(foreign.status).toBe(404);
    expect(amount.status).toBe(409);
    expect(amount.body.error.code).toBe('PAYMENT_MISMATCH');
    expect(currency.status).toBe(409);
    expect(currency.body.error.code).toBe('PAYMENT_MISMATCH');
    expect(memoryPayments()[0]?.status).toBe(PaymentStatus.CREATED);
    expect(memoryTickets()).toHaveLength(0);
  });

  it('keeps failed and pending payments from issuing tickets', async () => {
    const { member, registration } = await reservedRegistration();
    const order = await createOrder(member.token, registration.id);
    const orderId = order.body.data.payment.razorpayOrderId as string;

    mockProvider(orderId, 'pay_pending', 25000, 'authorized');
    const pending = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: 'pay_pending',
        razorpay_signature: signPayment(orderId, 'pay_pending'),
      });

    mockProvider(orderId, 'pay_failed', 25000, 'failed');
    const failed = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: 'pay_failed',
        razorpay_signature: signPayment(orderId, 'pay_failed'),
      });

    expect(pending.status).toBe(409);
    expect(pending.body.error.code).toBe('PAYMENT_PENDING');
    expect(failed.status).toBe(409);
    expect(failed.body.error.code).toBe('PAYMENT_FAILED');
    expect(memoryPayments()[0]?.status).toBe(PaymentStatus.FAILED);
    expect(memoryTickets()).toHaveLength(0);
  });

  it('is idempotent when verification is repeated or concurrent', async () => {
    const { member, registration } = await reservedRegistration();
    const order = await createOrder(member.token, registration.id);
    const orderId = order.body.data.payment.razorpayOrderId as string;
    const paymentId = 'pay_once';
    mockProvider(orderId, paymentId, 25000, 'captured');
    const body = {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signPayment(orderId, paymentId),
    };

    const [first, second] = await Promise.all([
      request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${member.token}`)
        .send(body),
      request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${member.token}`)
        .send(body),
    ]);
    const third = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${member.token}`)
      .send(body);

    expect([first.status, second.status, third.status]).toEqual([200, 200, 200]);
    expect(memoryTickets()).toHaveLength(1);
    expect(
      memoryPayments().filter((payment) => payment.status === PaymentStatus.PAID),
    ).toHaveLength(1);
    expect(first.body.data.ticket.qrToken).toBe(third.body.data.ticket.qrToken);
  });

  it('retries order creation after the provider fails and does not duplicate payments', async () => {
    const { member, registration } = await reservedRegistration();
    vi.mocked(createRazorpayOrder).mockRejectedValueOnce(new Error('network down'));

    const failed = await createOrder(member.token, registration.id);
    const retried = await createOrder(member.token, registration.id);
    const again = await createOrder(member.token, registration.id);

    expect(failed.status).toBe(503);
    expect(retried.status).toBe(201);
    expect(again.status).toBe(200);
    expect(again.body.data.alreadyExisted).toBe(true);
    expect(again.body.data.payment.razorpayOrderId).toBe(retried.body.data.payment.razorpayOrderId);
    expect(memoryPayments()).toHaveLength(1);
  });

  it('processes a captured webhook once and ignores a later failure', async () => {
    const { member, registration } = await reservedRegistration();
    const order = await createOrder(member.token, registration.id);
    const orderId = order.body.data.payment.razorpayOrderId as string;
    const captured = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_webhook_1',
            order_id: orderId,
            amount: 25000,
            currency: 'INR',
            status: 'captured',
          },
        },
      },
    };
    const capturedBody = JSON.stringify(captured);
    const postWebhook = (body: string, eventId: string, signature = signWebhook(body)) =>
      request(app)
        .post('/api/payments/webhook')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', signature)
        .set('x-razorpay-event-id', eventId)
        .send(body);

    const invalid = await postWebhook(capturedBody, 'evt_bad', 'not-a-signature');
    const first = await postWebhook(capturedBody, 'evt_captured');
    const duplicate = await postWebhook(capturedBody, 'evt_captured');
    const failedBody = JSON.stringify({
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: 'pay_webhook_late',
            order_id: orderId,
            amount: 25000,
            currency: 'INR',
            status: 'failed',
          },
        },
      },
    });
    const lateFailure = await postWebhook(failedBody, 'evt_failed_late');

    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('INVALID_SIGNATURE');
    expect(first.status).toBe(200);
    expect(first.body.data.outcome).toBe('PROCESSED');
    expect(duplicate.status).toBe(200);
    expect(duplicate.body.data.duplicate).toBe(true);
    expect(lateFailure.status).toBe(200);
    expect(lateFailure.body.data.ignored).toBe(true);
    expect(memoryPayments()[0]?.status).toBe(PaymentStatus.PAID);
    expect(memoryTickets()).toHaveLength(1);
  });

  it('records a full refund from a webhook and cancels an unused ticket', async () => {
    const { member, registration } = await reservedRegistration();
    const order = await createOrder(member.token, registration.id);
    const orderId = order.body.data.payment.razorpayOrderId as string;
    const capturedBody = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_refund_me',
            order_id: orderId,
            amount: 25000,
            currency: 'INR',
            status: 'captured',
          },
        },
      },
    });
    await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', signWebhook(capturedBody))
      .set('x-razorpay-event-id', 'evt_cap')
      .send(capturedBody);

    const refundBody = JSON.stringify({
      event: 'refund.processed',
      payload: {
        refund: {
          entity: { id: 'rfnd_1', payment_id: 'pay_refund_me', amount: 25000, currency: 'INR' },
        },
        payment: {
          entity: {
            id: 'pay_refund_me',
            order_id: orderId,
            amount: 25000,
            currency: 'INR',
            status: 'refunded',
          },
        },
      },
    });
    const refunded = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', signWebhook(refundBody))
      .set('x-razorpay-event-id', 'evt_refund')
      .send(refundBody);

    expect(refunded.status).toBe(200);
    expect(refunded.body.data.outcome).toBe('PROCESSED');
    expect(memoryPayments()[0]?.status).toBe(PaymentStatus.REFUNDED);
    expect(memoryTickets()[0]?.status).toBe('CANCELLED');
  });
});
