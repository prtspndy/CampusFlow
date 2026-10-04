import { Router, Request, Response } from 'express';
import { RegistrationStatus } from '@prisma/client';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/response.js';
import { authenticate } from '../middleware/authenticate.middleware.js';
import { requirePermission } from '../middleware/authorize.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware.js';
import { eventIdParamSchema } from '../validators/event.validators.js';
import {
  listEventRegistrationsQuerySchema,
  paginationQuerySchema,
  registrationIdParamSchema,
  registerForEventSchema,
  PaginationQuery,
  ListEventRegistrationsQuery,
  RegisterForEventInput,
} from '../validators/ticketing.validators.js';
import {
  cancelRegistration,
  getRegistration,
  listEventRegistrations,
  listOwnRegistrations,
  registerForEvent,
} from '../services/registration.service.js';

export const eventRegistrationRouter = Router();
export const registrationRouter = Router();

/**
 * POST /api/events/:eventId/registrations
 * The authenticated user registers themselves. Client-supplied user ids are ignored.
 */
eventRegistrationRouter.post(
  '/:eventId/registrations',
  authenticate,
  validateParams(eventIdParamSchema),
  validateBody(registerForEventSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const input = (req.body ?? {}) as RegisterForEventInput;
    const result = await registerForEvent(req.user!, req.params.eventId!, input.quantity ?? 1);
    const created = result.registration.status === 'CONFIRMED';
    return sendSuccess(
      res,
      result,
      created ? 'Registration confirmed' : 'Registration reserved pending payment',
      201,
    );
  }),
);

/**
 * GET /api/events/:eventId/registrations
 * Organizer or an admin with events.registrations.read.
 */
eventRegistrationRouter.get(
  '/:eventId/registrations',
  authenticate,
  requirePermission('events.registrations.read'),
  validateParams(eventIdParamSchema),
  validateQuery(listEventRegistrationsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListEventRegistrationsQuery;
    const result = await listEventRegistrations(
      req.user!,
      req.params.eventId!,
      query.page,
      query.limit,
      query.status as RegistrationStatus | undefined,
    );
    return sendSuccess(res, result, 'Registrations retrieved successfully');
  }),
);

registrationRouter.get(
  '/me',
  authenticate,
  requirePermission('tickets.read_own'),
  validateQuery(paginationQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as PaginationQuery;
    const result = await listOwnRegistrations(req.user!.id, query.page, query.limit);
    return sendSuccess(res, result, 'Registrations retrieved successfully');
  }),
);

registrationRouter.get(
  '/:registrationId',
  authenticate,
  validateParams(registrationIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await getRegistration(req.user!, req.params.registrationId!);
    return sendSuccess(res, result, 'Registration retrieved successfully');
  }),
);

registrationRouter.post(
  '/:registrationId/cancel',
  authenticate,
  validateParams(registrationIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await cancelRegistration(req.user!, req.params.registrationId!);
    return sendSuccess(res, result, 'Registration cancelled');
  }),
);
