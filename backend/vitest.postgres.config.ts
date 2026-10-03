import { defineConfig } from 'vitest/config';

const databaseUrl = process.env.PHASE4_TEST_DATABASE_URL ?? '';

if (!databaseUrl) {
  throw new Error('Set PHASE4_TEST_DATABASE_URL to an isolated local PostgreSQL database.');
}

const isLocal = /@((127\.0\.0\.1)|localhost)[:/]/.test(databaseUrl);
const isIsolatedTestDb =
  /\/campusflow_phase4_test(\?|$)/.test(databaseUrl) && !/\/neondb(\?|$)/.test(databaseUrl);

if (!isLocal || !isIsolatedTestDb) {
  throw new Error(
    'PHASE4_TEST_DATABASE_URL must point to an isolated test database (localhost and campusflow_phase4_test). Refusing shared database.',
  );
}

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    fileParallelism: false,
    testTimeout: 20000,
    include: ['tests/phase4.postgres.test.ts'],
    env: {
      NODE_ENV: 'test',
      PHASE4_POSTGRES: '1',
      DATABASE_URL: databaseUrl,
      DIRECT_URL: databaseUrl,
      JWT_ACCESS_SECRET: 'test-only-jwt-access-secret-do-not-use',
      TICKET_ENCRYPTION_KEY: 'test-only-ticket-encryption-key-0001',
      RAZORPAY_KEY_ID: 'rzp_test_campusflow',
      RAZORPAY_KEY_SECRET: 'test-razorpay-key-secret-32chars-min',
      RAZORPAY_WEBHOOK_SECRET: 'test-razorpay-webhook-secret-32chars',
    },
  },
});
