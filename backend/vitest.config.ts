import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 10000,
    include: ['tests/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://user:password@127.0.0.1:5432/campusflow_test',
      DIRECT_URL: 'postgresql://user:password@127.0.0.1:5432/campusflow_test',
      JWT_ACCESS_SECRET: 'test-only-jwt-access-secret-do-not-use',
      TICKET_ENCRYPTION_KEY: 'test-only-ticket-encryption-key-0001',
      RAZORPAY_KEY_ID: 'rzp_test_campusflow',
      RAZORPAY_KEY_SECRET: 'test-razorpay-key-secret-32chars-min',
      RAZORPAY_WEBHOOK_SECRET: 'test-razorpay-webhook-secret-32chars',
    },
  },
});
