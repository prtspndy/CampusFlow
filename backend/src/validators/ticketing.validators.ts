import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const registrationIdParamSchema = z.object({
  registrationId: z.string().uuid('Registration ID must be a valid UUID'),
});

export const ticketIdParamSchema = z.object({
  ticketId: z.string().uuid('Ticket ID must be a valid UUID'),
});

export const paymentIdParamSchema = z.object({
  paymentId: z.string().uuid('Payment ID must be a valid UUID'),
});

export const listEventRegistrationsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'EXPIRED']).optional(),
});

export const listPaymentsQuerySchema = paginationQuerySchema.extend({
  eventId: z.string().uuid('Event ID must be a valid UUID').optional(),
});

export const verifyPaymentSchema = z
  .object({
    razorpay_order_id: z.string().trim().min(1).max(64),
    razorpay_payment_id: z.string().trim().min(1).max(64),
    razorpay_signature: z.string().trim().min(1).max(256),
  })
  .strict();

export const ticketTokenSchema = z
  .object({
    token: z
      .string()
      .trim()
      .regex(/^cf_[A-Za-z0-9_-]{40,120}$/, 'Ticket token is invalid'),
  })
  .strict();

export type ListEventRegistrationsQuery = z.infer<typeof listEventRegistrationsQuerySchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
