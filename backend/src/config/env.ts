import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file if available
dotenv.config();

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
