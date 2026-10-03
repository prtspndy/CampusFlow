import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

describe('Health and System Observability Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api (API Service Metadata)', () => {
    it('returns HTTP 200 with service information and docs path', async () => {
      const res = await request(app).get('/api');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('CampusFlow API is online');
      expect(res.body.data).toMatchObject({
        name: 'CampusFlow API',
        version: '0.1.0',
        phase: '00-foundation',
        docs: '/api/docs',
      });
    });
  });

  describe('GET /api/health (Liveness Probe)', () => {
    it('returns HTTP 200 with UP status and valid envelope', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Service is healthy');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.status).toBe('UP');
      expect(res.body.data.service).toBe('campusflow-backend');
      expect(typeof res.body.data.timestamp).toBe('string');
    });

    it('propagates or assigns correlation ID in response header and body', async () => {
      const clientCorrelationId = 'custom-request-id-456';
      const res = await request(app).get('/api/health').set('X-Request-Id', clientCorrelationId);

      expect(res.status).toBe(200);
      expect(res.headers['x-request-id']).toBe(clientCorrelationId);
    });
  });

  describe('GET /api/health/ready (Readiness Probe)', () => {
    it('returns HTTP 200 when database probe query succeeds', async () => {
      vi.spyOn(prisma, '$queryRaw').mockResolvedValueOnce([{ 1: 1 }]);

      const res = await request(app).get('/api/health/ready');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Service is ready');
      expect(res.body.data.status).toBe('READY');
      expect(res.body.data.database).toBe('CONNECTED');
      expect(typeof res.body.data.timestamp).toBe('string');
    });

    it('returns HTTP 503 when database is disconnected or probe query fails', async () => {
      vi.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(
        new Error('Database connection timed out'),
      );

      const res = await request(app).get('/api/health/ready');

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
      expect(res.body.error.message).toBe('Database readiness check failed');
      // Verify raw database error was not exposed to the client
      expect(res.body.error.details).toEqual([]);
    });
  });

  describe('Error and 404 Middleware Handling', () => {
    it('returns HTTP 404 with standardized error contract for unknown routes', async () => {
      const res = await request(app).get('/api/non-existent-route');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatchObject({
        code: 'NOT_FOUND',
        message: 'Cannot GET /api/non-existent-route',
        details: [],
      });
    });

    it('returns HTTP 400 for malformed JSON request bodies', async () => {
      const res = await request(app)
        .post('/api')
        .set('Content-Type', 'application/json')
        .send('{"invalidJson": unquotedValue}');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Malformed JSON payload in request body',
        details: [],
      });
    });
  });

  describe('CORS and Security Headers', () => {
    it('sets Access-Control-Allow-Origin header for configured frontend origin', async () => {
      const res = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('includes Helmet security headers in responses', async () => {
      const res = await request(app).get('/api/health');

      expect(res.headers['x-dns-prefetch-control']).toBe('off');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });
  });
});
