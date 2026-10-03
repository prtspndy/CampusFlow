import { z } from 'zod';

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .max(254, 'Email must be at most 254 characters')
  .email('Invalid email address format')
  .transform((value) => value.toLowerCase());

const nameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(80, 'Name must be at most 80 characters');

const newPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must include a letter')
  .regex(/[0-9]/, 'Password must include a number');

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: newPasswordSchema,
  })
  .strict();

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, 'Password is required')
    .max(72, 'Password must be at most 72 characters'),
});

export const refreshSchema = z
  .object({
    refreshToken: z
      .string()
      .min(20, 'Refresh token is required')
      .max(512, 'Refresh token is invalid'),
  })
  .strict();

export const updateProfileSchema = z
  .object({
    name: nameSchema,
  })
  .strict();

export const userIdParamSchema = z.object({
  userId: z.string().uuid('User id must be a UUID'),
});

export const assignRoleSchema = z
  .object({
    role: z.enum(['ADMIN', 'MEMBER', 'EVENT_MANAGER', 'TREASURER'], {
      errorMap: () => ({
        message: "Role must be 'ADMIN', 'MEMBER', 'EVENT_MANAGER', or 'TREASURER'",
      }),
    }),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
