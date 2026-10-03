import { z } from 'zod';

export const opportunityStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED']);
export const volunteerSignupStatusEnum = z.enum(['REGISTERED', 'ATTENDED', 'CANCELLED', 'NO_SHOW']);

export const opportunityIdParamSchema = z.object({
  id: z.string().uuid('Invalid opportunity ID'),
});

export const signupIdParamSchema = z.object({
  id: z.string().uuid('Invalid signup ID'),
});

export const createOpportunitySchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(150),
    description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
    location: z.string().min(2, 'Location must be at least 2 characters').max(200),
    startsAt: z.string().datetime({ message: 'startsAt must be a valid ISO 8601 date string' }),
    endsAt: z.string().datetime({ message: 'endsAt must be a valid ISO 8601 date string' }),
    applicationDeadline: z
      .string()
      .datetime({ message: 'applicationDeadline must be a valid ISO 8601 date string' })
      .optional()
      .nullable(),
    capacity: z.number().int().positive('Capacity must be a positive integer'),
    category: z.string().max(50).optional().nullable(),
    eligibility: z.string().max(500).optional().nullable(),
    eventId: z.string().uuid().optional().nullable(),
    status: opportunityStatusEnum.optional(),
  })
  .refine(
    (data) => new Date(data.endsAt) > new Date(data.startsAt),
    {
      message: 'End time must be after start time',
      path: ['endsAt'],
    },
  )
  .refine(
    (data) => {
      if (!data.applicationDeadline) return true;
      return new Date(data.applicationDeadline) <= new Date(data.startsAt);
    },
    {
      message: 'Application deadline must be on or before start time',
      path: ['applicationDeadline'],
    },
  );

export const updateOpportunitySchema = z
  .object({
    title: z.string().min(3).max(150).optional(),
    description: z.string().min(10).max(5000).optional(),
    location: z.string().min(2).max(200).optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    applicationDeadline: z.string().datetime().optional().nullable(),
    capacity: z.number().int().positive().optional(),
    category: z.string().max(50).optional().nullable(),
    eligibility: z.string().max(500).optional().nullable(),
    eventId: z.string().uuid().optional().nullable(),
    status: opportunityStatusEnum.optional(),
  })
  .refine(
    (data) => {
      if (data.startsAt && data.endsAt) {
        return new Date(data.endsAt) > new Date(data.startsAt);
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['endsAt'],
    },
  );

export const listOpportunitiesQuerySchema = z.object({
  search: z.string().max(100).optional(),
  status: opportunityStatusEnum.optional(),
  category: z.string().max(50).optional(),
  eventId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createSignupSchema = z.object({
  notes: z.string().max(500).optional(),
});

export const updateAttendanceSchema = z.object({
  status: volunteerSignupStatusEnum,
  attendanceNotes: z.string().max(500).optional(),
});

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;
export type ListOpportunitiesQuery = z.infer<typeof listOpportunitiesQuerySchema>;
export type CreateSignupInput = z.infer<typeof createSignupSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
