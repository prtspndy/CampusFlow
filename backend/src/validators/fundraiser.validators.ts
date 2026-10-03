import { z } from 'zod';

export const fundraiserStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'CLOSED', 'CANCELLED']);
export const contributionStatusEnum = z.enum(['PENDING', 'VERIFIED', 'FAILED', 'REFUNDED']);

export const fundraiserIdParamSchema = z.object({
  id: z.string().uuid('Invalid fundraiser ID'),
});

export const contributionIdParamSchema = z.object({
  id: z.string().uuid('Invalid contribution ID'),
});

export const createFundraiserSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(150),
    description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
    purpose: z.string().max(200).optional().nullable(),
    goalAmount: z.number().int().positive('Goal amount must be a positive integer'),
    currency: z.string().length(3).default('INR'),
    startsAt: z.string().datetime().optional().nullable(),
    deadline: z.string().datetime().optional().nullable(),
    beneficiary: z.string().max(200).optional().nullable(),
    status: fundraiserStatusEnum.optional(),
  })
  .refine(
    (data) => {
      if (data.startsAt && data.deadline) {
        return new Date(data.deadline) > new Date(data.startsAt);
      }
      return true;
    },
    {
      message: 'Deadline must be after start time',
      path: ['deadline'],
    },
  );

export const updateFundraiserSchema = z
  .object({
    title: z.string().min(3).max(150).optional(),
    description: z.string().min(10).max(5000).optional(),
    purpose: z.string().max(200).optional().nullable(),
    goalAmount: z.number().int().positive().optional(),
    startsAt: z.string().datetime().optional().nullable(),
    deadline: z.string().datetime().optional().nullable(),
    beneficiary: z.string().max(200).optional().nullable(),
    status: fundraiserStatusEnum.optional(),
  })
  .refine(
    (data) => {
      if (data.startsAt && data.deadline) {
        return new Date(data.deadline) > new Date(data.startsAt);
      }
      return true;
    },
    {
      message: 'Deadline must be after start time',
      path: ['deadline'],
    },
  );

export const listFundraisersQuerySchema = z.object({
  search: z.string().max(100).optional(),
  status: fundraiserStatusEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createContributionSchema = z.object({
  amount: z.number().int().positive('Contribution amount must be a positive integer'),
  donorName: z.string().min(2, 'Donor name must be at least 2 characters').max(100),
  donorEmail: z.string().email('Valid donor email is required'),
  paymentMethod: z.enum(['ONLINE', 'CASH', 'DIRECT']).default('ONLINE'),
  currency: z.string().length(3).default('INR'),
  idempotencyKey: z.string().max(128).optional(),
});

export const verifyContributionSchema = z.object({
  razorpayOrderId: z.string().min(1, 'razorpayOrderId is required'),
  razorpayPaymentId: z.string().min(1, 'razorpayPaymentId is required'),
  razorpaySignature: z.string().min(1, 'razorpaySignature is required'),
});

export const listContributionsQuerySchema = z.object({
  status: contributionStatusEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateFundraiserInput = z.infer<typeof createFundraiserSchema>;
export type UpdateFundraiserInput = z.infer<typeof updateFundraiserSchema>;
export type ListFundraisersQuery = z.infer<typeof listFundraisersQuerySchema>;
export type CreateContributionInput = z.infer<typeof createContributionSchema>;
export type VerifyContributionInput = z.infer<typeof verifyContributionSchema>;
export type ListContributionsQuery = z.infer<typeof listContributionsQuerySchema>;
