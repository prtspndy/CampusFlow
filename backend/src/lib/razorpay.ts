import { createRequire } from 'node:module';
import Razorpay from 'razorpay';
import { env } from '../config/env.js';
import { ServiceUnavailableError } from '../utils/errors.js';

const require = createRequire(import.meta.url);
const razorpayUtils = require('razorpay/dist/utils/razorpay-utils.js') as {
  validatePaymentVerification: (
    params: { order_id: string; payment_id: string },
    signature: string,
    secret: string,
  ) => boolean;
  validateWebhookSignature: (body: string, signature: string, secret: string) => boolean;
};

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
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  if (!env.RAZORPAY_KEY_SECRET || !signature) {
    return false;
  }
  try {
    return razorpayUtils.validatePaymentVerification(
      { order_id: orderId, payment_id: paymentId },
      signature,
      env.RAZORPAY_KEY_SECRET,
    );
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
    return razorpayUtils.validateWebhookSignature(
      rawBody.toString('utf8'),
      signature,
      env.RAZORPAY_WEBHOOK_SECRET,
    );
  } catch {
    return false;
  }
}
