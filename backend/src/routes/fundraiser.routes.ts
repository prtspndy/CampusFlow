import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/response.js';
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.middleware.js';
import { requireAnyPermission, requirePermission } from '../middleware/authorize.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware.js';
import { hasPermission } from '../types/auth.js';
import {
  createContributionSchema,
  createFundraiserSchema,
  fundraiserIdParamSchema,
  listContributionsQuerySchema,
  listFundraisersQuerySchema,
  updateFundraiserSchema,
  verifyContributionSchema,
  type CreateContributionInput,
  type CreateFundraiserInput,
  type ListContributionsQuery,
  type ListFundraisersQuery,
  type UpdateFundraiserInput,
  type VerifyContributionInput,
} from '../validators/fundraiser.validators.js';
import {
  createContribution,
  createFundraiser,
  getFundraiser,
  getFundraiserSummary,
  listContributions,
  listFundraisers,
  listMyContributions,
  setFundraiserStatus,
  updateFundraiser,
  verifyContribution,
} from '../services/fundraiser.service.js';
import { FundraiserStatus } from '@prisma/client';

export const fundraiserRouter = Router();

// 1. List Fundraisers
fundraiserRouter.get(
  '/',
  optionalAuthenticate,
  validateQuery(listFundraisersQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListFundraisersQuery;
    const canManage = Boolean(req.user && hasPermission(req.user.role, 'fundraisers.manage'));
    const result = await listFundraisers(query, canManage);
    return sendSuccess(res, result, 'Fundraisers retrieved successfully');
  }),
);

// 2. Create Fundraiser (Staff)
fundraiserRouter.post(
  '/',
  authenticate,
  requirePermission('fundraisers.manage'),
  validateBody(createFundraiserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const fundraiser = await createFundraiser(req.user!.id, req.body as CreateFundraiserInput);
    return sendSuccess(res, fundraiser, 'Fundraiser created successfully', 201);
  }),
);

// 3. User's own donations
fundraiserRouter.get(
  '/my-donations',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const donations = await listMyContributions(req.user!.id);
    return sendSuccess(res, donations, 'My donations retrieved successfully');
  }),
);

// 4. Verify Contribution Payment
fundraiserRouter.post(
  '/verify',
  optionalAuthenticate,
  validateBody(verifyContributionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await verifyContribution(req.body as VerifyContributionInput);
    return sendSuccess(res, result, 'Contribution payment verified successfully');
  }),
);

// 5. Get Fundraiser Details
fundraiserRouter.get(
  '/:id',
  optionalAuthenticate,
  validateParams(fundraiserIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const canManage = Boolean(req.user && hasPermission(req.user.role, 'fundraisers.manage'));
    const fundraiser = await getFundraiser(req.params.id!, canManage);
    return sendSuccess(res, fundraiser, 'Fundraiser retrieved successfully');
  }),
);

// 6. Update Fundraiser (Staff)
fundraiserRouter.patch(
  '/:id',
  authenticate,
  requirePermission('fundraisers.manage'),
  validateParams(fundraiserIdParamSchema),
  validateBody(updateFundraiserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const fundraiser = await updateFundraiser(
      req.params.id!,
      req.body as UpdateFundraiserInput,
    );
    return sendSuccess(res, fundraiser, 'Fundraiser updated successfully');
  }),
);

// 7. Publish Fundraiser
fundraiserRouter.post(
  '/:id/publish',
  authenticate,
  requirePermission('fundraisers.manage'),
  validateParams(fundraiserIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const fundraiser = await setFundraiserStatus(req.params.id!, FundraiserStatus.ACTIVE);
    return sendSuccess(res, fundraiser, 'Fundraiser published successfully');
  }),
);

// 8. Close Fundraiser
fundraiserRouter.post(
  '/:id/close',
  authenticate,
  requirePermission('fundraisers.manage'),
  validateParams(fundraiserIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const fundraiser = await setFundraiserStatus(req.params.id!, FundraiserStatus.CLOSED);
    return sendSuccess(res, fundraiser, 'Fundraiser closed successfully');
  }),
);

// 9. Create Contribution (Donate)
fundraiserRouter.post(
  '/:id/contributions',
  optionalAuthenticate,
  validateParams(fundraiserIdParamSchema),
  validateBody(createContributionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const donorId = req.user?.id ?? null;
    const result = await createContribution(
      req.params.id!,
      donorId,
      req.body as CreateContributionInput,
    );
    return sendSuccess(res, result, 'Contribution created successfully', 201);
  }),
);

// 10. List Contributions for a Fundraiser (Staff)
fundraiserRouter.get(
  '/:id/contributions',
  authenticate,
  requireAnyPermission('fundraisers.manage', 'finance.read'),
  validateParams(fundraiserIdParamSchema),
  validateQuery(listContributionsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListContributionsQuery;
    const result = await listContributions(req.params.id!, query);
    return sendSuccess(res, result, 'Contributions retrieved successfully');
  }),
);

// 11. Fundraiser Summary
fundraiserRouter.get(
  '/:id/summary',
  optionalAuthenticate,
  validateParams(fundraiserIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const summary = await getFundraiserSummary(req.params.id!);
    return sendSuccess(res, summary, 'Fundraiser summary retrieved successfully');
  }),
);
