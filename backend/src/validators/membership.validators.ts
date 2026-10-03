import { z } from 'zod';

export const MEMBERSHIP_PLANS = ['annual', 'semester', 'lifetime'] as const;
export type MembershipPlanType = (typeof MEMBERSHIP_PLANS)[number];

export const createMembershipSchema = z
  .object({
    planName: z.enum(MEMBERSHIP_PLANS, {
      errorMap: () => ({ message: "planName must be 'annual', 'semester', or 'lifetime'" }),
    }),
    notes: z.string().trim().max(500, 'Notes must be at most 500 characters').optional(),
  })
  .strict();

export const applyMembershipSchema = createMembershipSchema;

export const renewMembershipSchema = z
  .object({
    planName: z.enum(MEMBERSHIP_PLANS).optional(),
  })
  .strict();

export const updateMembershipStatusSchema = z
  .object({
    status: z.enum(['ACTIVE', 'SUSPENDED', 'REJECTED', 'EXPIRED'], {
      errorMap: () => ({
        message: "Status must be 'ACTIVE', 'SUSPENDED', 'REJECTED', or 'EXPIRED'",
      }),
    }),
    adminNotes: z.string().trim().max(500, 'Notes must be at most 500 characters').optional(),
  })
  .strict();

export const listMembershipsQuerySchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'REJECTED']).optional(),
  planName: z.string().trim().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const membershipIdParamSchema = z.object({
  membershipId: z.string().uuid('Membership ID must be a valid UUID'),
});

export type CreateMembershipInput = z.infer<typeof createMembershipSchema>;
export type ApplyMembershipInput = CreateMembershipInput;
export type RenewMembershipInput = z.infer<typeof renewMembershipSchema>;
export type UpdateMembershipStatusInput = z.infer<typeof updateMembershipStatusSchema>;
export type ListMembershipsQuery = z.infer<typeof listMembershipsQuerySchema>;
