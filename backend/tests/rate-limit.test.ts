import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createAuthRateLimiter } from '../src/middleware/rate-limit.middleware.js';

describe('Authentication rate limit', () => {
  it('returns the standard 429 envelope after the limit is exceeded', async () => {
    const app = express();
    app.use(createAuthRateLimiter(2, 60_000));
    app.post('/api/auth/login', (_req, res) => {
      res.status(200).json({ success: true });
    });

    await request(app).post('/api/auth/login');
    await request(app).post('/api/auth/login');
    const limited = await request(app).post('/api/auth/login');

    expect(limited.status).toBe(429);
    expect(limited.body).toEqual({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many authentication attempts. Please try again later.',
        details: [],
      },
    });
  });
});
