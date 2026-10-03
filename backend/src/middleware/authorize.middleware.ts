import { NextFunction, Request, Response } from 'express';
import { hasPermission, normalizeRole, Permission, UserRole } from '../types/auth.js';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';

export function requirePermission(permission: Permission | string) {
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

export function requireAnyPermission(...permissions: (Permission | string)[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication is required', 'UNAUTHORIZED'));
      return;
    }

    const authorized = permissions.some((perm) => hasPermission(req.user!.role, perm));
    if (!authorized) {
      next(new ForbiddenError('You do not have permission to perform this action', 'FORBIDDEN'));
      return;
    }

    next();
  };
}

export function requireRole(...roles: (UserRole | string)[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication is required', 'UNAUTHORIZED'));
      return;
    }

    const userRole = normalizeRole(req.user.role);
    const normalizedRoles = roles.map((r) => normalizeRole(r));
    if (!normalizedRoles.includes(userRole)) {
      next(new ForbiddenError('You do not have the required role to access this resource', 'FORBIDDEN'));
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

    const canReadAnyUser = hasPermission(req.user.role, 'users.read') || hasPermission(req.user.role, 'users:read:any');
    if (req.user.id !== targetId && !canReadAnyUser) {
      next(new ForbiddenError('You can only access your own profile', 'FORBIDDEN'));
      return;
    }

    next();
  };
}
