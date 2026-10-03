import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/response.js';
import { UnauthorizedError } from '../utils/errors.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/authenticate.middleware.js';
import { requirePermission } from '../middleware/authorize.middleware.js';
import { authRateLimiter } from '../middleware/rate-limit.middleware.js';
import {
  loginSchema,
  refreshSchema,
  registerSchema,
  updateProfileSchema,
} from '../validators/auth.validators.js';
import {
  getUserById,
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
  updateOwnProfile,
} from '../services/auth.service.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  authRateLimiter,
  validateBody(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await registerUser(req.body);
    return sendSuccess(res, user, 'Account created successfully', 201);
  }),
);

authRouter.post(
  '/login',
  authRateLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const session = await loginUser(req.body);
    return sendSuccess(res, session, 'Signed in successfully');
  }),
);

authRouter.post(
  '/refresh',
  authRateLimiter,
  validateBody(refreshSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const session = await refreshSession(req.body.refreshToken);
    return sendSuccess(res, session, 'Session refreshed successfully');
  }),
);

authRouter.post(
  '/logout',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication is required', 'UNAUTHORIZED');
    }
    await logoutUser(req.user.id);
    return sendSuccess(res, null, 'Signed out successfully');
  }),
);

authRouter.get(
  '/me',
  authenticate,
  requirePermission('profile:read'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication is required', 'UNAUTHORIZED');
    }
    const user = await getUserById(req.user.id);
    return sendSuccess(res, user, 'Authenticated user retrieved successfully');
  }),
);

authRouter.patch(
  '/me',
  authenticate,
  requirePermission('profile:update'),
  validateBody(updateProfileSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication is required', 'UNAUTHORIZED');
    }
    const user = await updateOwnProfile(req.user.id, req.body.name);
    req.user = { ...req.user, name: user.name };
    return sendSuccess(res, user, 'Profile updated successfully');
  }),
);
