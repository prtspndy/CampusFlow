import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/response.js';
import { authenticate } from '../middleware/authenticate.middleware.js';
import { requirePermission } from '../middleware/authorize.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware.js';
import { eventIdParamSchema } from '../validators/event.validators.js';
import {
  paginationQuerySchema,
  ticketIdParamSchema,
  ticketTokenSchema,
  PaginationQuery,
} from '../validators/ticketing.validators.js';
import {
  checkInTicket,
  getOwnTicket,
  getTicketQr,
  listAttendance,
  listOwnTickets,
  validateTicket,
} from '../services/ticket.service.js';

export const eventTicketRouter = Router();
export const ticketRouter = Router();

eventTicketRouter.post(
  '/:eventId/tickets/validate',
  authenticate,
  requirePermission('tickets.validate'),
  validateParams(eventIdParamSchema),
  validateBody(ticketTokenSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await validateTicket(req.user!, req.params.eventId!, req.body.token as string);
    return sendSuccess(res, result, 'Ticket validation completed');
  }),
);

eventTicketRouter.post(
  '/:eventId/check-in',
  authenticate,
  requirePermission('attendance.manage'),
  validateParams(eventIdParamSchema),
  validateBody(ticketTokenSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await checkInTicket(req.user!, req.params.eventId!, req.body.token as string);
    return sendSuccess(res, result, 'Attendee checked in');
  }),
);

eventTicketRouter.get(
  '/:eventId/attendance',
  authenticate,
  requirePermission('attendance.read'),
  validateParams(eventIdParamSchema),
  validateQuery(paginationQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as PaginationQuery;
    const result = await listAttendance(req.user!, req.params.eventId!, query.page, query.limit);
    return sendSuccess(res, result, 'Attendance retrieved successfully');
  }),
);

ticketRouter.get(
  '/me',
  authenticate,
  requirePermission('tickets.read_own'),
  validateQuery(paginationQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as PaginationQuery;
    const result = await listOwnTickets(req.user!.id, query.page, query.limit);
    return sendSuccess(res, result, 'Tickets retrieved successfully');
  }),
);

ticketRouter.get(
  '/:ticketId/qr',
  authenticate,
  requirePermission('tickets.read_own'),
  validateParams(ticketIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await getTicketQr(req.user!.id, req.params.ticketId!);
    return sendSuccess(res, result, 'Ticket QR retrieved successfully');
  }),
);

ticketRouter.get(
  '/:ticketId',
  authenticate,
  validateParams(ticketIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await getOwnTicket(req.user!, req.params.ticketId!);
    return sendSuccess(res, result, 'Ticket retrieved successfully');
  }),
);
