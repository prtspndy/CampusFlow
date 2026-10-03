import { z } from 'zod';

export const expenseStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export const expenseCategoryEnum = z.enum([
  'SUPPLIES',
  'TRAVEL',
  'VENUE',
  'REFRESHMENTS',
  'EQUIPMENT',
  'MARKETING',
  'OTHER',
]);
export const reimbursementStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SETTLED']);

export const expenseIdParamSchema = z.object({
  id: z.string().uuid('Invalid expense ID'),
});

export const reimbursementIdParamSchema = z.object({
  id: z.string().uuid('Invalid reimbursement ID'),
});

export const createExpenseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(150),
  description: z.string().min(5, 'Description must be at least 5 characters').max(2000),
  amount: z.number().int().positive('Amount must be a positive integer in INR'),
  currency: z.string().length(3).default('INR'),
  category: expenseCategoryEnum.default('OTHER'),
  expenseDate: z.string().datetime({ message: 'expenseDate must be a valid ISO 8601 date string' }),
  receiptUrl: z.string().url().optional().nullable().or(z.literal('')),
  eventId: z.string().uuid().optional().nullable(),
  fundraiserId: z.string().uuid().optional().nullable(),
});

export const updateExpenseSchema = z.object({
  title: z.string().min(3).max(150).optional(),
  description: z.string().min(5).max(2000).optional(),
  amount: z.number().int().positive().optional(),
  category: expenseCategoryEnum.optional(),
  expenseDate: z.string().datetime().optional(),
  receiptUrl: z.string().url().optional().nullable().or(z.literal('')),
  eventId: z.string().uuid().optional().nullable(),
  fundraiserId: z.string().uuid().optional().nullable(),
});

export const rejectExpenseSchema = z.object({
  reason: z.string().min(3, 'Rejection reason must be provided').max(500),
});

export const listExpensesQuerySchema = z.object({
  status: expenseStatusEnum.optional(),
  category: expenseCategoryEnum.optional(),
  submitterId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
  fundraiserId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const settleReimbursementSchema = z.object({
  settlementReference: z.string().min(2, 'Settlement reference (e.g. UTR / transaction ID) is required').max(100),
  notes: z.string().max(500).optional(),
});

export const rejectReimbursementSchema = z.object({
  reason: z.string().min(3, 'Rejection reason must be provided').max(500),
});

export const listReimbursementsQuerySchema = z.object({
  status: reimbursementStatusEnum.optional(),
  claimantId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const listLedgerQuerySchema = z.object({
  category: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type RejectExpenseInput = z.infer<typeof rejectExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
export type SettleReimbursementInput = z.infer<typeof settleReimbursementSchema>;
export type RejectReimbursementInput = z.infer<typeof rejectReimbursementSchema>;
export type ListReimbursementsQuery = z.infer<typeof listReimbursementsQuerySchema>;
export type ListLedgerQuery = z.infer<typeof listLedgerQuerySchema>;
