import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/response.js';
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.middleware.js';
import { requirePermission } from '../middleware/authorize.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware.js';
import {
  createEventSchema,
  updateEventSchema,
  eventIdParamSchema,
  listEventsQuerySchema,
  ListEventsQuery,
} from '../validators/event.validators.js';
import {
  createEvent,
  getEventById,
  updateEvent,
  publishEvent,
  cancelEvent,
  listEvents,
} from '../services/event.service.js';

export const eventRouter = Router();

/**
 * POST /api/events
 * Authorized user (volunteer, door_staff, treasurer, admin) creates a new event.
 */
eventRouter.post(
  '/',
  authenticate,
  requirePermission('events:create'),
  validateBody(createEventSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const event = await createEvent(req.user!.id, req.body);
    return sendSuccess(res, event, 'Event created successfully', 201);
  }),
);

/**
 * GET /api/events
 * Retrieve list of events with filtering and pagination.
 * Public users view PUBLISHED events. Users with 'events:read:drafts' view drafts too.
 */
eventRouter.get(
  '/',
  optionalAuthenticate,
  validateQuery(listEventsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await listEvents(req.query as unknown as ListEventsQuery, req.user);
    return sendSuccess(res, result, 'Events retrieved successfully');
  }),
);

/**
 * GET /api/events/:eventId
 * Retrieve single event details. Drafts and cancelled events restricted to creator or authorized staff.
 */
eventRouter.get(
  '/:eventId',
  optionalAuthenticate,
  validateParams(eventIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const event = await getEventById(req.params.eventId!, req.user);
    return sendSuccess(res, event, 'Event retrieved successfully');
  }),
);

/**
 * PATCH /api/events/:eventId
 * Update event details (creator or events:manage:any).
 */
eventRouter.patch(
  '/:eventId',
  authenticate,
  validateParams(eventIdParamSchema),
  validateBody(updateEventSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const event = await updateEvent(req.params.eventId!, req.user!, req.body);
    return sendSuccess(res, event, 'Event updated successfully');
  }),
);

/**
 * POST /api/events/:eventId/publish
 * Transition event from DRAFT to PUBLISHED (creator or events:manage:any).
 */
eventRouter.post(
  '/:eventId/publish',
  authenticate,
  validateParams(eventIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const event = await publishEvent(req.params.eventId!, req.user!);
    return sendSuccess(res, event, 'Event published successfully');
  }),
);

/**
 * POST /api/events/:eventId/cancel
 * Cancel an event (creator or events:manage:any).
 */
eventRouter.post(
  '/:eventId/cancel',
  authenticate,
  validateParams(eventIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const event = await cancelEvent(req.params.eventId!, req.user!);
    return sendSuccess(res, event, 'Event cancelled successfully');
  }),
);
