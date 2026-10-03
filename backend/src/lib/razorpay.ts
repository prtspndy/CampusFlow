import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env.js';
import { ServiceUnavailableError } from '../utils/errors.js';

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export interface RazorpayPaymentEntity {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
}

export interface CreateOrderInput {
  amount: number;
  currency: string;
  receipt: string;
  notes: Record<string, string>;
}

let client: Razorpay | null = null;

export function razorpayConfigured(): boolean {
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

function getClient(): Razorpay {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new ServiceUnavailableError('Payment provider is not configured');
  }
  if (!client) {
    client = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }
  return client;
}

export function publicRazorpayKeyId(): string | null {
  return env.RAZORPAY_KEY_ID ?? null;
}

export async function createRazorpayOrder(input: CreateOrderInput): Promise<RazorpayOrder> {
  const order = await getClient().orders.create({
    amount: input.amount,
    currency: input.currency,
    receipt: input.receipt,
    notes: input.notes,
  });
  return {
    id: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    status: order.status,
  };
}

export async function fetchRazorpayOrder(orderId: string): Promise<RazorpayOrder> {
  const order = await getClient().orders.fetch(orderId);
  return {
    id: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    status: order.status,
  };
}

export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPaymentEntity> {
  const payment = await getClient().payments.fetch(paymentId);
  return {
    id: payment.id,
    order_id: String(payment.order_id),
    amount: Number(payment.amount),
    currency: payment.currency,
    status: payment.status,
  };
}

/**
 * Official checkout signature: HMAC-SHA256 of `order_id|payment_id` with the key secret.
 * Compares using constant-time timingSafeEqual.
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  if (!env.RAZORPAY_KEY_SECRET || !signature || !orderId || !paymentId) {
    return false;
  }
  try {
    const expected = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    const expectedBuf = Buffer.from(expected, 'utf8');
    const signatureBuf = Buffer.from(signature, 'utf8');
    if (expectedBuf.length !== signatureBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch {
    return false;
  }
}

/**
 * Official webhook signature: HMAC-SHA256 of the raw body with the webhook secret.
 * This secret is separate from the checkout key secret.
 */
export function verifyWebhookSignature(rawBody: Buffer, signature: string | undefined): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET || !signature) {
    return false;
  }
  try {
    const expected = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');
    const expectedBuf = Buffer.from(expected, 'utf8');
    const signatureBuf = Buffer.from(signature, 'utf8');
    if (expectedBuf.length !== signatureBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch {
    return false;
  }
}
