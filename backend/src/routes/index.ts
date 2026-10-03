import { Router, Request, Response } from 'express';
import { healthRouter } from './health.routes.js';
import { sendSuccess } from '../utils/response.js';

export const rootRouter = Router();

// Mount Health and Readiness probes under /health
rootRouter.use('/health', healthRouter);

/**
 * GET /api
 * Root API service information endpoint.
 */
rootRouter.get('/', (_req: Request, res: Response) => {
  return sendSuccess(
    res,
    {
      name: 'CampusFlow API',
      version: '0.1.0',
      phase: '00-foundation',
      docs: '/api/docs',
    },
    'CampusFlow API is online',
    200,
  );
});
