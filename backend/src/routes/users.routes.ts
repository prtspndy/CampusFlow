import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/response.js';
import { authenticate } from '../middleware/authenticate.middleware.js';
import { requireSelfOrAdmin } from '../middleware/authorize.middleware.js';
import { validateParams } from '../middleware/validate.middleware.js';
import { userIdParamSchema } from '../validators/auth.validators.js';
import { getUserById } from '../services/auth.service.js';
import { NotFoundError } from '../utils/errors.js';

export const usersRouter = Router();

usersRouter.get(
  '/:userId',
  authenticate,
  validateParams(userIdParamSchema),
  requireSelfOrAdmin('userId'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId;
    if (!userId) {
      throw new NotFoundError('User not found');
    }
    const user = await getUserById(userId);
    return sendSuccess(res, user, 'User profile retrieved successfully');
  }),
);
