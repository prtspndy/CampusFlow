import { z } from 'zod';

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const productIdParamSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
});

export const orderIdParamSchema = z.object({
  orderId: z.string().uuid('Order ID must be a valid UUID'),
});

export const announcementIdParamSchema = z.object({
  announcementId: z.string().uuid('Announcement ID must be a valid UUID'),
});

const variantSchema = z.object({
  size: z.enum(sizes),
  stock: z.coerce.number().int().min(0).max(100000),
});

export const createProductSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().min(10).max(5000),
    imageUrl: z.string().url().optional(),
    category: z.string().trim().min(2).max(50),
    sku: z.string().trim().min(2).max(40).optional(),
    memberPrice: z.coerce.number().int().min(0).max(1_000_000),
    standardPrice: z.coerce.number().int().min(0).max(1_000_000),
    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
    variants: z.array(variantSchema).min(1).max(12),
  })
  .strict()
  .refine((data) => new Set(data.variants.map((variant) => variant.size)).size === data.variants.length, {
    message: 'Each size can only be listed once',
    path: ['variants'],
  });

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    description: z.string().trim().min(10).max(5000).optional(),
    imageUrl: z.string().url().nullable().optional(),
    category: z.string().trim().min(2).max(50).optional(),
    sku: z.string().trim().min(2).max(40).nullable().optional(),
    memberPrice: z.coerce.number().int().min(0).max(1_000_000).optional(),
    standardPrice: z.coerce.number().int().min(0).max(1_000_000).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  })
  .strict();

export const adjustStockSchema = z
  .object({
    size: z.enum(sizes),
    stock: z.coerce.number().int().min(0).max(100000),
    expectedStock: z.coerce.number().int().min(0).max(100000),
  })
  .strict();

export const listProductsQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(80).optional(),
  category: z.string().trim().max(50).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  sort: z.enum(['name', 'createdAt', 'standardPrice']).default('createdAt'),
  direction: z.enum(['asc', 'desc']).default('desc'),
});

export const createOrderSchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          size: z.enum(sizes),
          quantity: z.coerce.number().int().min(1).max(20),
        }),
      )
      .min(1)
      .max(20),
    idempotencyKey: z.string().trim().min(8).max(80).optional(),
  })
  .strict();

export const listOrdersQuerySchema = paginationQuerySchema;

export const createAnnouncementSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    body: z.string().trim().min(10).max(8000),
    audience: z.enum(['ALL_MEMBERS', 'VOLUNTEERS', 'EVENT_ATTENDEES']).default('ALL_MEMBERS'),
  })
  .strict();

export const updateAnnouncementSchema = z
  .object({
    title: z.string().trim().min(3).max(160).optional(),
    body: z.string().trim().min(10).max(8000).optional(),
    audience: z.enum(['ALL_MEMBERS', 'VOLUNTEERS', 'EVENT_ATTENDEES']).optional(),
  })
  .strict();

export const listAnnouncementsQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(80).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
export type ListAnnouncementsQuery = z.infer<typeof listAnnouncementsQuerySchema>;
