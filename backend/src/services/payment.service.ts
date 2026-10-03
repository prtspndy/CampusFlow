import crypto from 'node:crypto';
import { Payment, PaymentStatus, Prisma, RegistrationStatus, TicketStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { isPrismaCode } from '../lib/prisma-errors.js';
import { env } from '../config/env.js';
import {
  createRazorpayOrder,
  fetchRazorpayOrder,
  fetchRazorpayPayment,
  publicRazorpayKeyId,
  razorpayConfigured,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../lib/razorpay.js';
import { AuthenticatedUser, hasPermission } from '../types/auth.js';
import {
  AppError,
  BadRequestError,
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
} from '../utils/errors.js';
import { expirePendingRegistration, toPublicRegistration } from './registration.service.js';
import { issueTicketRecord, withQr } from './ticket.service.js';
import { paymentSourcesFor } from './ticket-state.js';

type Tx = Prisma.TransactionClient;

const OPEN_PAYMENT: PaymentStatus[] = [PaymentStatus.CREATED, PaymentStatus.PENDING];

export interface VerifyPaymentInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

function toPublicPayment(payment: Payment, includeKey = false) {
  return {
    id: payment.id,
    registrationId: payment.registrationId,
    eventId: payment.eventId,
    userId: payment.userId,
    status: payment.status,
    amountPaise: payment.amountPaise,
    currency: payment.currency,
    razorpayOrderId: payment.razorpayOrderId,
    razorpayPaymentId: payment.razorpayPaymentId,
    signatureVerifiedAt: payment.signatureVerifiedAt,
    ...(includeKey ? { keyId: publicRazorpayKeyId() } : {}),
  };
}

async function callProvider<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('[payments] provider request failed');
    throw new ServiceUnavailableError('Payment provider request failed');
  }
}

export async function createPaymentOrder(userId: string, registrationId: string) {
  if (!razorpayConfigured()) {
    throw new ServiceUnavailableError('Payment provider is not configured');
  }

  const registration = await prisma.eventRegistration.findUnique({ where: { id: registrationId } });
  if (!registration || registration.userId !== userId) {
    throw new NotFoundError('Registration not found');
  }

  if (await expirePendingRegistration(registrationId)) {
    throw new BadRequestError('Registration is closed', [], 'REGISTRATION_CLOSED');
  }

  if (registration.status === RegistrationStatus.CONFIRMED) {
    throw new ConflictError('Registration is already confirmed', 'ALREADY_CONFIRMED');
  }
  if (registration.status !== RegistrationStatus.PENDING_PAYMENT) {
    throw new ConflictError('Registration is not awaiting payment', 'REGISTRATION_NOT_PAYABLE');
  }
  if (registration.amountPaise <= 0) {
    throw new BadRequestError('This registration does not require payment');
  }

  const open = await prisma.payment.findFirst({
    where: { registrationId, status: { in: OPEN_PAYMENT } },
    orderBy: { createdAt: 'desc' },
  });
  if (open?.razorpayOrderId) {
    return { payment: toPublicPayment(open, true), alreadyExisted: true };
  }

  const order = await callProvider(() =>
    createRazorpayOrder({
      amount: registration.amountPaise,
      currency: registration.currency,
      receipt: registration.id.replace(/-/g, '').slice(0, 40),
      notes: {
        registrationId: registration.id,
        eventId: registration.eventId,
        userId,
      },
    }),
  );

  if (order.amount !== registration.amountPaise || order.currency !== registration.currency) {
    throw new ServiceUnavailableError('Payment provider returned an unexpected amount');
  }

  try {
    const payment = open
      ? await prisma.payment.update({
          where: { id: open.id },
          data: { razorpayOrderId: order.id, status: PaymentStatus.CREATED },
        })
      : await prisma.payment.create({
          data: {
            registrationId: registration.id,
            eventId: registration.eventId,
            userId,
            razorpayOrderId: order.id,
            amountPaise: registration.amountPaise,
            currency: registration.currency,
            status: PaymentStatus.CREATED,
          },
        });
    return { payment: toPublicPayment(payment, true), alreadyExisted: false };
  } catch (error) {
    if (isPrismaCode(error, 'P2002')) {
      const existing = await prisma.payment.findFirst({
        where: { registrationId, status: { in: OPEN_PAYMENT } },
        orderBy: { createdAt: 'desc' },
      });
      if (existing) {
        return { payment: toPublicPayment(existing, true), alreadyExisted: true };
      }
    }
    throw error;
  }
}

async function settleCapturedPayment(
  tx: Tx,
  input: { orderId: string; paymentId: string; amountPaise: number; currency: string },
) {
  const payment = await tx.payment.findUnique({ where: { razorpayOrderId: input.orderId } });
  if (!payment) {
    throw new NotFoundError('Payment not found');
  }
  if (payment.amountPaise !== input.amountPaise || payment.currency !== input.currency) {
    throw new ConflictError('Payment amount or currency does not match', 'PAYMENT_MISMATCH');
  }

  if (payment.status === PaymentStatus.PAID) {
    if (payment.razorpayPaymentId !== input.paymentId) {
      throw new ConflictError('Payment has already been completed', 'PAYMENT_ALREADY_COMPLETED');
    }
  } else if (payment.status === PaymentStatus.REFUNDED) {
    throw new ConflictError('Payment has been refunded', 'PAYMENT_REFUNDED');
  } else {
    const updated = await tx.payment.updateMany({
      where: {
        id: payment.id,
        status: { in: paymentSourcesFor(PaymentStatus.PAID) },
        amountPaise: input.amountPaise,
        currency: input.currency,
      },
      data: {
        status: PaymentStatus.PAID,
        razorpayPaymentId: input.paymentId,
        signatureVerifiedAt: new Date(),
        failureReason: null,
      },
    });
    if (updated.count !== 1) {
      const current = await tx.payment.findUnique({ where: { id: payment.id } });
      if (current?.status !== PaymentStatus.PAID || current.razorpayPaymentId !== input.paymentId) {
        throw new ConflictError('Payment could not be confirmed', 'PAYMENT_NOT_CONFIRMABLE');
      }
    }

    await tx.eventRegistration.updateMany({
      where: { id: payment.registrationId, status: RegistrationStatus.PENDING_PAYMENT },
      data: { status: RegistrationStatus.CONFIRMED },
    });
  }

  const registration = await tx.eventRegistration.findUnique({
    where: { id: payment.registrationId },
  });
  if (!registration || registration.status !== RegistrationStatus.CONFIRMED) {
    throw new ConflictError('Registration is not awaiting payment', 'REGISTRATION_NOT_PAYABLE');
  }

  const settled = await tx.payment.findUnique({ where: { id: payment.id } });
  if (!settled) {
    throw new NotFoundError('Payment not found');
  }
  const issued = await issueTicketRecord(tx, registration);
  return { payment: settled, registration, issued };
}

export async function verifyPayment(userId: string, input: VerifyPaymentInput) {
  if (!razorpayConfigured()) {
    throw new ServiceUnavailableError('Payment provider is not configured');
  }

  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: input.razorpay_order_id },
  });
  if (!payment || payment.userId !== userId) {
    throw new NotFoundError('Payment not found');
  }

  if (await expirePendingRegistration(payment.registrationId)) {
    throw new BadRequestError('Registration is closed', [], 'REGISTRATION_CLOSED');
  }

  if (
    !verifyPaymentSignature(
      input.razorpay_order_id,
      input.razorpay_payment_id,
      input.razorpay_signature,
    )
  ) {
    throw new BadRequestError('Payment signature is invalid', [], 'INVALID_SIGNATURE');
  }

  const remotePayment = await callProvider(() => fetchRazorpayPayment(input.razorpay_payment_id));
  const remoteOrder = await callProvider(() => fetchRazorpayOrder(input.razorpay_order_id));

  if (
    remotePayment.order_id !== input.razorpay_order_id ||
    remoteOrder.id !== input.razorpay_order_id
  ) {
    throw new ConflictError('Payment does not match the stored order', 'PAYMENT_MISMATCH');
  }

  if (
    remotePayment.amount !== payment.amountPaise ||
    remotePayment.currency !== payment.currency ||
    remoteOrder.amount !== payment.amountPaise ||
    remoteOrder.currency !== payment.currency
  ) {
    throw new ConflictError('Payment amount or currency does not match', 'PAYMENT_MISMATCH');
  }

  if (remotePayment.status === 'failed') {
    if (payment.status === PaymentStatus.PAID) {
      throw new ConflictError('Payment has already been completed', 'PAYMENT_ALREADY_COMPLETED');
    }
    await prisma.payment.updateMany({
      where: { id: payment.id, status: { in: paymentSourcesFor(PaymentStatus.FAILED) } },
      data: { status: PaymentStatus.FAILED, failureReason: 'Payment failed' },
    });
    throw new ConflictError('Payment failed', 'PAYMENT_FAILED');
  }

  if (remotePayment.status !== 'captured') {
    if (payment.status !== PaymentStatus.PAID) {
      await prisma.payment.updateMany({
        where: { id: payment.id, status: { in: paymentSourcesFor(PaymentStatus.PENDING) } },
        data: { status: PaymentStatus.PENDING },
      });
    }
    throw new ConflictError('Payment is not captured yet', 'PAYMENT_PENDING');
  }

  const confirmed = await prisma.$transaction((tx) =>
    settleCapturedPayment(tx, {
      orderId: input.razorpay_order_id,
      paymentId: input.razorpay_payment_id,
      amountPaise: payment.amountPaise,
      currency: payment.currency,
    }),
  );

  return {
    payment: toPublicPayment(confirmed.payment),
    registration: toPublicRegistration(confirmed.registration),
    ticket: await withQr(confirmed.issued.ticket, confirmed.issued.qrToken),
  };
}

export async function getPayment(user: AuthenticatedUser, paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) {
    throw new NotFoundError('Payment not found');
  }
  const canReadAll = hasPermission(user.role, 'payments.read');
  if (payment.userId !== user.id && !canReadAll) {
    throw new NotFoundError('Payment not found');
  }
  return toPublicPayment(
    payment,
    payment.userId === user.id && OPEN_PAYMENT.includes(payment.status),
  );
}

export async function listPayments(eventId: string | undefined, page: number, limit: number) {
  const where = eventId ? { eventId } : {};
  const [total, rows] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    payments: rows.map((payment) => toPublicPayment(payment)),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

interface WebhookFacts {
  orderId: string | null;
  paymentId: string | null;
  amountPaise: number | null;
  currency: string | null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function readEntity(payload: unknown, key: string): Record<string, unknown> | null {
  const body = asRecord(asRecord(payload)?.payload);
  return asRecord(asRecord(body?.[key])?.entity);
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function factsFromPayment(entity: Record<string, unknown> | null): WebhookFacts {
  return {
    orderId: readString(entity?.order_id),
    paymentId: readString(entity?.id),
    amountPaise: readNumber(entity?.amount),
    currency: readString(entity?.currency),
  };
}

function readWebhookFacts(eventType: string, payload: unknown): WebhookFacts | null {
  if (eventType === 'refund.processed') {
    const refund = readEntity(payload, 'refund');
    const payment = factsFromPayment(readEntity(payload, 'payment'));
    const paymentId = readString(refund?.payment_id) ?? payment.paymentId;
    const amountPaise = readNumber(refund?.amount) ?? payment.amountPaise;
    if (!paymentId || amountPaise === null) {
      return null;
    }
    return {
      orderId: payment.orderId,
      paymentId,
      amountPaise,
      currency: readString(refund?.currency) ?? payment.currency,
    };
  }

  const payment = factsFromPayment(readEntity(payload, 'payment'));
  if (eventType === 'order.paid' && !payment.orderId) {
    const order = readEntity(payload, 'order');
    payment.orderId = readString(order?.id);
    payment.amountPaise = payment.amountPaise ?? readNumber(order?.amount);
    payment.currency = payment.currency ?? readString(order?.currency);
  }
  if (!payment.orderId || !payment.paymentId || payment.amountPaise === null || !payment.currency) {
    return null;
  }
  return payment;
}

async function applyWebhook(
  tx: Tx,
  eventType: string,
  facts: WebhookFacts,
): Promise<'PROCESSED' | 'IGNORED'> {
  const payment = facts.orderId
    ? await tx.payment.findUnique({ where: { razorpayOrderId: facts.orderId } })
    : await tx.payment.findUnique({ where: { razorpayPaymentId: facts.paymentId ?? undefined } });

  if (!payment || facts.amountPaise === null || !facts.currency) {
    return 'IGNORED';
  }
  if (payment.amountPaise !== facts.amountPaise || payment.currency !== facts.currency) {
    throw new ConflictError('Payment amount or currency does not match', 'PAYMENT_MISMATCH');
  }

  if (eventType === 'payment.failed') {
    if (payment.status === PaymentStatus.PAID || payment.status === PaymentStatus.REFUNDED) {
      return 'IGNORED';
    }
    await tx.payment.updateMany({
      where: { id: payment.id, status: { in: paymentSourcesFor(PaymentStatus.FAILED) } },
      data: { status: PaymentStatus.FAILED, failureReason: 'Payment failed' },
    });
    return 'PROCESSED';
  }

  if (eventType === 'refund.processed') {
    if (payment.status === PaymentStatus.REFUNDED) {
      return 'IGNORED';
    }
    const refunded = await tx.payment.updateMany({
      where: { id: payment.id, status: PaymentStatus.PAID },
      data: { status: PaymentStatus.REFUNDED },
    });
    if (refunded.count !== 1) {
      return 'IGNORED';
    }

    const ticket = await tx.ticket.findUnique({
      where: { registrationId: payment.registrationId },
    });
    if (ticket?.status === TicketStatus.USED) {
      return 'PROCESSED';
    }
    if (ticket?.status === TicketStatus.ISSUED) {
      await tx.ticket.updateMany({
        where: { id: ticket.id, status: TicketStatus.ISSUED },
        data: { status: TicketStatus.CANCELLED },
      });
    }
    const cancelled = await tx.eventRegistration.updateMany({
      where: { id: payment.registrationId, status: RegistrationStatus.CONFIRMED },
      data: { status: RegistrationStatus.CANCELLED, cancelledAt: new Date() },
    });
    if (cancelled.count === 1) {
      await tx.event.updateMany({
        where: { id: payment.eventId, registeredCount: { gt: 0 } },
        data: { registeredCount: { decrement: 1 } },
      });
    }
    return 'PROCESSED';
  }

  if (!facts.orderId || !facts.paymentId) {
    return 'IGNORED';
  }

  await settleCapturedPayment(tx, {
    orderId: facts.orderId,
    paymentId: facts.paymentId,
    amountPaise: facts.amountPaise,
    currency: facts.currency,
  });
  return 'PROCESSED';
}

async function rememberDelivery(
  id: string,
  eventType: string,
  razorpayOrderId: string | null,
  outcome: string,
) {
  try {
    await prisma.paymentWebhookDelivery.create({
      data: { id, eventType, razorpayOrderId, outcome },
    });
    return { duplicate: false, ignored: outcome === 'IGNORED', outcome };
  } catch (error) {
    if (isPrismaCode(error, 'P2002')) {
      return { duplicate: true, ignored: true, outcome: 'DUPLICATE' };
    }
    throw error;
  }
}

export async function processWebhook(
  rawBody: Buffer,
  signature: string | undefined,
  eventIdHeader: string | undefined,
) {
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    throw new ServiceUnavailableError('Payment webhook is not configured');
  }
  if (!verifyWebhookSignature(rawBody, signature)) {
    throw new BadRequestError('Webhook signature is invalid', [], 'INVALID_SIGNATURE');
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody.toString('utf8')) as unknown;
  } catch {
    throw new BadRequestError('Webhook payload is not valid JSON');
  }

  const eventType = readString(asRecord(payload)?.event);
  if (!eventType) {
    throw new BadRequestError('Webhook event type is missing');
  }

  const deliveryId =
    eventIdHeader?.trim() || crypto.createHash('sha256').update(rawBody).digest('hex');
  const supported = new Set([
    'payment.captured',
    'order.paid',
    'payment.failed',
    'refund.processed',
  ]);
  if (!supported.has(eventType)) {
    return rememberDelivery(deliveryId, eventType, null, 'IGNORED');
  }

  const facts = readWebhookFacts(eventType, payload);
  if (!facts) {
    throw new BadRequestError('Webhook payload is missing payment identifiers');
  }

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.paymentWebhookDelivery.create({
        data: {
          id: deliveryId,
          eventType,
          razorpayOrderId: facts.orderId,
          outcome: 'RECEIVED',
        },
      });
      const outcome = await applyWebhook(tx, eventType, facts);
      await tx.paymentWebhookDelivery.update({
        where: { id: deliveryId },
        data: { outcome },
      });
      return { duplicate: false, ignored: outcome === 'IGNORED', outcome };
    });
  } catch (error) {
    if (isPrismaCode(error, 'P2002')) {
      return { duplicate: true, ignored: false, outcome: 'DUPLICATE' };
    }
    throw error;
  }
}
