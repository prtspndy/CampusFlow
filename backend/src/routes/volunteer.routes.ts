import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/response.js';
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.middleware.js';
import { requirePermission } from '../middleware/authorize.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware.js';
import { hasPermission } from '../types/auth.js';
import {
  createOpportunitySchema,
  createSignupSchema,
  listOpportunitiesQuerySchema,
  opportunityIdParamSchema,
  signupIdParamSchema,
  updateAttendanceSchema,
  updateOpportunitySchema,
  type CreateOpportunityInput,
  type CreateSignupInput,
  type ListOpportunitiesQuery,
  type UpdateAttendanceInput,
  type UpdateOpportunityInput,
} from '../validators/volunteer.validators.js';
import {
  cancelSignup,
  createOpportunity,
  getOpportunity,
  listMySignups,
  listOpportunities,
  listParticipants,
  setOpportunityStatus,
  signupForOpportunity,
  updateAttendance,
  updateOpportunity,
} from '../services/volunteer.service.js';
import { OpportunityStatus } from '@prisma/client';

export const volunteerRouter = Router();

// 1. List Opportunities
volunteerRouter.get(
  '/opportunities',
  optionalAuthenticate,
  validateQuery(listOpportunitiesQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListOpportunitiesQuery;
    const canManage = Boolean(req.user && hasPermission(req.user.role, 'volunteers.manage'));
    const result = await listOpportunities(query, canManage);
    return sendSuccess(res, result, 'Volunteer opportunities retrieved successfully');
  }),
);

// 2. Create Opportunity (Staff: Event Manager / Admin)
volunteerRouter.post(
  '/opportunities',
  authenticate,
  requirePermission('volunteers.manage'),
  validateBody(createOpportunitySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const opportunity = await createOpportunity(req.user!.id, req.body as CreateOpportunityInput);
    return sendSuccess(res, opportunity, 'Volunteer opportunity created successfully', 201);
  }),
);

// 3. User's own signups (Must be before /opportunities/:id to avoid route collision)
volunteerRouter.get(
  '/signups/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const signups = await listMySignups(req.user!.id);
    return sendSuccess(res, signups, 'My volunteer signups retrieved successfully');
  }),
);

// 4. Cancel a volunteer signup
volunteerRouter.post(
  '/signups/:id/cancel',
  authenticate,
  validateParams(signupIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const canManage = hasPermission(req.user!.role, 'volunteers.manage');
    const signup = await cancelSignup(req.params.id!, req.user!.id, canManage);
    return sendSuccess(res, signup, 'Volunteer registration cancelled successfully');
  }),
);

// 5. Update attendance / participation record (Staff)
volunteerRouter.patch(
  '/signups/:id/attendance',
  authenticate,
  requirePermission('volunteers.manage'),
  validateParams(signupIdParamSchema),
  validateBody(updateAttendanceSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as UpdateAttendanceInput;
    const signup = await updateAttendance(
      req.params.id!,
      req.user!.id,
      body.status,
      body.attendanceNotes,
    );
    return sendSuccess(res, signup, 'Participation record updated successfully');
  }),
);

// 6. Get Opportunity details
volunteerRouter.get(
  '/opportunities/:id',
  optionalAuthenticate,
  validateParams(opportunityIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const canManage = Boolean(req.user && hasPermission(req.user.role, 'volunteers.manage'));
    const opportunity = await getOpportunity(req.params.id!, canManage);
    return sendSuccess(res, opportunity, 'Volunteer opportunity retrieved successfully');
  }),
);

// 7. Update Opportunity details (Staff)
volunteerRouter.patch(
  '/opportunities/:id',
  authenticate,
  requirePermission('volunteers.manage'),
  validateParams(opportunityIdParamSchema),
  validateBody(updateOpportunitySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const opportunity = await updateOpportunity(
      req.params.id!,
      req.body as UpdateOpportunityInput,
    );
    return sendSuccess(res, opportunity, 'Volunteer opportunity updated successfully');
  }),
);

// 8. Publish Opportunity
volunteerRouter.post(
  '/opportunities/:id/publish',
  authenticate,
  requirePermission('volunteers.manage'),
  validateParams(opportunityIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const opportunity = await setOpportunityStatus(req.params.id!, OpportunityStatus.PUBLISHED);
    return sendSuccess(res, opportunity, 'Volunteer opportunity published successfully');
  }),
);

// 9. Close Opportunity
volunteerRouter.post(
  '/opportunities/:id/close',
  authenticate,
  requirePermission('volunteers.manage'),
  validateParams(opportunityIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const opportunity = await setOpportunityStatus(req.params.id!, OpportunityStatus.CLOSED);
    return sendSuccess(res, opportunity, 'Volunteer opportunity closed successfully');
  }),
);

// 10. Cancel Opportunity
volunteerRouter.post(
  '/opportunities/:id/cancel',
  authenticate,
  requirePermission('volunteers.manage'),
  validateParams(opportunityIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const opportunity = await setOpportunityStatus(req.params.id!, OpportunityStatus.CANCELLED);
    return sendSuccess(res, opportunity, 'Volunteer opportunity cancelled successfully');
  }),
);

// 11. Sign up for Opportunity
volunteerRouter.post(
  '/opportunities/:id/signups',
  authenticate,
  requirePermission('volunteers.signup'),
  validateParams(opportunityIdParamSchema),
  validateBody(createSignupSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateSignupInput;
    const signup = await signupForOpportunity(req.params.id!, req.user!.id, body.notes);
    return sendSuccess(res, signup, 'Signed up for volunteer opportunity successfully', 201);
  }),
);

// 12. List Participants (Staff only)
volunteerRouter.get(
  '/opportunities/:id/participants',
  authenticate,
  requirePermission('volunteers.manage'),
  validateParams(opportunityIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const participants = await listParticipants(req.params.id!);
    return sendSuccess(res, participants, 'Participants retrieved successfully');
  }),
);
