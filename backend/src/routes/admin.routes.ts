import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/response.js';
import { authenticate } from '../middleware/authenticate.middleware.js';
import { requirePermission } from '../middleware/authorize.middleware.js';
import { validateBody, validateParams } from '../middleware/validate.middleware.js';
import { assignRoleSchema, userIdParamSchema } from '../validators/auth.validators.js';
import { listUsers, updateUserRole } from '../services/auth.service.js';

export const adminRouter = Router();

adminRouter.get(
  '/users',
  authenticate,
  requirePermission('users.read'),
  asyncHandler(async (_req: Request, res: Response) => {
    const users = await listUsers();
    return sendSuccess(res, { users }, 'Users retrieved successfully');
  }),
);

adminRouter.patch(
  '/users/:userId/role',
  authenticate,
  requirePermission('users.assign_roles'),
  validateParams(userIdParamSchema),
  validateBody(assignRoleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const { role } = req.body;
    const updated = await updateUserRole(req.user!.id, userId, role);
    return sendSuccess(res, { user: updated }, 'User role updated successfully');
  }),
);
