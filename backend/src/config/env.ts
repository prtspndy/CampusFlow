import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file if available
dotenv.config();

const isTest = process.env.NODE_ENV === 'test';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1024).max(65535).default(5000),
  API_PREFIX: z
    .string()
    .default('/api')
    .transform((val) => (val.startsWith('/') ? val : `/${val}`)),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  JWT_ACCESS_SECRET: isTest
    ? z.string().min(32).default('test-only-jwt-access-secret-do-not-use')
    : z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  JWT_ISSUER: z.string().min(1).default('campusflow'),
  JWT_AUDIENCE: z.string().min(1).default('campusflow-api'),
  BCRYPT_ROUNDS: z.coerce
    .number()
    .int()
    .min(4)
    .max(15)
    .default(isTest ? 4 : 12),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(1000).default(10),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).max(3_600_000).default(900_000),
  TICKET_ENCRYPTION_KEY:
    process.env.NODE_ENV === 'production'
      ? z.string().min(32, 'TICKET_ENCRYPTION_KEY must be at least 32 characters')
      : z
          .string()
          .min(32)
          .default(
            isTest
              ? 'test-only-ticket-encryption-key-0001'
              : 'dev-only-ticket-encryption-key-change',
          ),
  RAZORPAY_KEY_ID: z
    .string()
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value.trim() : undefined)),
  RAZORPAY_KEY_SECRET: z
    .string()
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value.trim() : undefined)),
  RAZORPAY_WEBHOOK_SECRET: z
    .string()
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value.trim() : undefined)),
});

export type EnvConfig = z.infer<typeof envSchema> & {
  allowedOrigins: string[];
};

function loadAndValidateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    // Never print raw process.env or potential secrets in errors
    console.error(
      `\x1b[31m[CONFIG ERROR] Invalid environment configuration:\n${errorDetails}\x1b[0m`,
    );
    process.exit(1);
  }

  const parsed = result.data;

  // Split comma-separated origins, trim whitespaces and filter out empty entries
  const allowedOrigins = parsed.FRONTEND_URL
    ? parsed.FRONTEND_URL.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : ['http://localhost:5173'];

  return {
    ...parsed,
    allowedOrigins,
  };
}

export const env = loadAndValidateEnv();
