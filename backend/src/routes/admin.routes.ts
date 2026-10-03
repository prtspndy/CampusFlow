import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/response.js';
import { authenticate } from '../middleware/authenticate.middleware.js';
import { requirePermission } from '../middleware/authorize.middleware.js';
import { listUsers } from '../services/auth.service.js';

export const adminRouter = Router();

adminRouter.get(
  '/users',
  authenticate,
  requirePermission('users:list'),
  asyncHandler(async (_req: Request, res: Response) => {
    const users = await listUsers();
    return sendSuccess(res, { users }, 'Users retrieved successfully');
  }),
);
