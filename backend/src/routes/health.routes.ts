import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/async-handler.js';

export const healthRouter = Router();

/**
 * GET /api/health
 * Liveness probe: returns 200 when the Express HTTP process is active and accepting requests.
 */
healthRouter.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    return sendSuccess(
      res,
      {
        status: 'UP',
        service: 'campusflow-backend',
        timestamp: new Date().toISOString(),
      },
      'Service is healthy',
      200,
    );
  }),
);

/**
 * GET /api/health/ready
 * Readiness probe: verifies that the Neon PostgreSQL database connection is operational.
 * Returns 200 only if `SELECT 1` succeeds. Returns 503 if unreachable or unconfigured.
 */
healthRouter.get(
  '/ready',
  asyncHandler(async (_req: Request, res: Response) => {
    // If DATABASE_URL is not configured, report unavailable immediately
    if (!env.DATABASE_URL) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Database readiness check failed',
          details: [],
        },
      });
    }

    try {
      // Execute lightweight probe query
      await prisma.$queryRaw`SELECT 1`;

      return sendSuccess(
        res,
        {
          status: 'READY',
          database: 'CONNECTED',
          timestamp: new Date().toISOString(),
        },
        'Service is ready',
        200,
      );
    } catch (dbError) {
      // Log diagnostic info safely on server without exposing credentials or internal topology
      console.warn('[HEALTH CHECK] Database connection verification failed:', {
        name: dbError instanceof Error ? dbError.name : 'UnknownError',
        message: dbError instanceof Error ? dbError.message : 'Unknown error during SELECT 1',
      });

      return res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Database readiness check failed',
          details: [],
        },
      });
    }
  }),
);
