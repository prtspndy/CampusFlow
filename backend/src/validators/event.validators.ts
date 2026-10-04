import { z } from 'zod';

const isoDateTimeSchema = z.string().datetime({ message: 'Must be a valid ISO 8601 date string' });

export const createEventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(120, 'Title must be at most 120 characters'),
    description: z
      .string()
      .trim()
      .min(10, 'Description must be at least 10 characters')
      .max(5000, 'Description must be at most 5000 characters'),
    venue: z
      .string()
      .trim()
      .min(2, 'Venue must be at least 2 characters')
      .max(200, 'Venue must be at most 200 characters'),
    category: z.string().trim().min(2).max(50).nullable().optional(),
    imageUrl: z.string().url('Invalid image URL format').nullable().optional(),
    startsAt: isoDateTimeSchema,
    endsAt: isoDateTimeSchema,
    memberPrice: z.coerce.number().int().min(0, 'memberPrice cannot be negative').default(0),
    standardPrice: z.coerce.number().int().min(0, 'standardPrice cannot be negative').default(0),
    price: z.coerce.number().int().min(0).optional(),
    totalCapacity: z.coerce.number().int().min(1, 'totalCapacity must be at least 1').nullable().optional(),
    capacity: z.coerce.number().int().min(1).nullable().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
    isFeatured: z.boolean().default(false),
  })
  .strict()
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: 'endsAt must be after startsAt',
    path: ['endsAt'],
  })
  .transform((data) => ({
    ...data,
    standardPrice: data.standardPrice || (data.price ?? 0),
    totalCapacity: data.totalCapacity !== undefined ? data.totalCapacity : (data.capacity ?? null),
  }));

export const updateEventSchema = z
  .object({
    title: z.string().trim().min(3).max(120).optional(),
    description: z.string().trim().min(10).max(5000).optional(),
    venue: z.string().trim().min(2).max(200).optional(),
    category: z.string().trim().min(2).max(50).nullable().optional(),
    imageUrl: z.string().url('Invalid image URL format').nullable().optional(),
    startsAt: isoDateTimeSchema.optional(),
    endsAt: isoDateTimeSchema.optional(),
    memberPrice: z.coerce.number().int().min(0).optional(),
    standardPrice: z.coerce.number().int().min(0).optional(),
    price: z.coerce.number().int().min(0).optional(),
    totalCapacity: z.coerce.number().int().min(1).nullable().optional(),
    capacity: z.coerce.number().int().min(1).optional(),
    isFeatured: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.startsAt && data.endsAt) {
        return new Date(data.endsAt) > new Date(data.startsAt);
      }
      return true;
    },
    {
      message: 'endsAt must be after startsAt',
      path: ['endsAt'],
    },
  )
  .transform((data) => ({
    ...data,
    standardPrice: data.standardPrice !== undefined ? data.standardPrice : data.price,
    totalCapacity: data.totalCapacity !== undefined ? data.totalCapacity : data.capacity,
  }));

export const listEventsQuerySchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED']).optional(),
  category: z.string().trim().optional(),
  search: z.string().trim().optional(),
  from: isoDateTimeSchema.optional(),
  to: isoDateTimeSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const eventIdParamSchema = z.object({
  eventId: z.string().uuid('Event ID must be a valid UUID'),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
