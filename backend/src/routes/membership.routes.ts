import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/response.js';
import { authenticate } from '../middleware/authenticate.middleware.js';
import { requirePermission } from '../middleware/authorize.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware.js';
import {
  applyMembershipSchema,
  renewMembershipSchema,
  updateMembershipStatusSchema,
  membershipIdParamSchema,
  listMembershipsQuerySchema,
} from '../validators/membership.validators.js';
import {
  applyForMembership,
  getOwnMembership,
  getMembershipById,
  renewMembership,
  updateMembershipStatus,
  listMemberships,
} from '../services/membership.service.js';

export const membershipRouter = Router();

/**
 * POST /api/memberships or POST /api/memberships/apply
 * Authenticated user applies for or initiates membership.
 */
membershipRouter.post(
  '/',
  authenticate,
  requirePermission('membership:apply'),
  validateBody(applyMembershipSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const membership = await applyForMembership(req.user!.id, req.body);
    return sendSuccess(res, membership, 'Membership application submitted successfully', 201);
  }),
);

membershipRouter.post(
  '/apply',
  authenticate,
  requirePermission('membership:apply'),
  validateBody(applyMembershipSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const membership = await applyForMembership(req.user!.id, req.body);
    return sendSuccess(res, membership, 'Membership application submitted successfully', 201);
  }),
);

/**
 * GET /api/memberships/me
 * Authenticated user retrieves their membership records.
 */
membershipRouter.get(
  '/me',
  authenticate,
  requirePermission('membership:read:own'),
  asyncHandler(async (req: Request, res: Response) => {
    const memberships = await getOwnMembership(req.user!.id);
    return sendSuccess(res, memberships, 'Retrieved user memberships successfully');
  }),
);

/**
 * GET /api/memberships
 * Authorized staff retrieves membership list with pagination and filtering.
 */
membershipRouter.get(
  '/',
  authenticate,
  requirePermission('membership:read:any'),
  validateQuery(listMembershipsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await listMemberships(
      req.query as unknown as Parameters<typeof listMemberships>[0],
    );
    return sendSuccess(res, result, 'Memberships retrieved successfully');
  }),
);

/**
 * GET /api/memberships/:membershipId
 * Retrieve single membership details (own record or authorized manager).
 */
membershipRouter.get(
  '/:membershipId',
  authenticate,
  validateParams(membershipIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const membership = await getMembershipById(req.params.membershipId!, req.user!);
    return sendSuccess(res, membership, 'Membership details retrieved successfully');
  }),
);

/**
 * POST /api/memberships/:membershipId/renew
 * Renew membership (owner or authorized manager).
 */
membershipRouter.post(
  '/:membershipId/renew',
  authenticate,
  requirePermission('membership:renew:own'),
  validateParams(membershipIdParamSchema),
  validateBody(renewMembershipSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const membership = await renewMembership(req.params.membershipId!, req.user!, req.body);
    return sendSuccess(res, membership, 'Membership renewed successfully');
  }),
);

/**
 * PATCH /api/memberships/:membershipId/status
 * Authorized staff updates membership status (ACTIVE, SUSPENDED, REJECTED, EXPIRED).
 */
membershipRouter.patch(
  '/:membershipId/status',
  authenticate,
  requirePermission('membership:manage'),
  validateParams(membershipIdParamSchema),
  validateBody(updateMembershipStatusSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const membership = await updateMembershipStatus(
      req.params.membershipId!,
      req.body.status,
      req.body.adminNotes,
    );
    return sendSuccess(res, membership, 'Membership status updated successfully');
  }),
);
