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
    },
  },
});
