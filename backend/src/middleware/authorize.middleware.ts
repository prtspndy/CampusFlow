import { NextFunction, Request, Response } from 'express';
import { hasPermission, Permission } from '../types/auth.js';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';

export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication is required', 'UNAUTHORIZED'));
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      next(new ForbiddenError('You do not have permission to perform this action', 'FORBIDDEN'));
      return;
    }

    next();
  };
}

export function requireSelfOrAdmin(paramName = 'userId') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication is required', 'UNAUTHORIZED'));
      return;
    }

    const targetId = req.params[paramName];
    if (typeof targetId !== 'string') {
      next(new ForbiddenError('You can only access your own profile', 'FORBIDDEN'));
      return;
    }

    if (req.user.id !== targetId && !hasPermission(req.user.role, 'users:read:any')) {
      next(new ForbiddenError('You can only access your own profile', 'FORBIDDEN'));
      return;
    }

    next();
  };
}
