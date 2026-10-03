import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/response.js';
import { BadRequestError } from '../utils/errors.js';
import { authenticate } from '../middleware/authenticate.middleware.js';
import { requirePermission } from '../middleware/authorize.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware.js';
import {
  listPaymentsQuerySchema,
  paymentIdParamSchema,
  registrationIdParamSchema,
  verifyPaymentSchema,
  ListPaymentsQuery,
  VerifyPaymentInput,
} from '../validators/ticketing.validators.js';
import {
  createPaymentOrder,
  getPayment,
  listPayments,
  processWebhook,
  verifyPayment,
} from '../services/payment.service.js';

export const registrationPaymentRouter = Router();
export const paymentRouter = Router();

/**
 * POST /api/registrations/:registrationId/payment-order
 * Creates a Razorpay order for the caller's own pending registration.
 */
registrationPaymentRouter.post(
  '/:registrationId/payment-order',
  authenticate,
  validateParams(registrationIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await createPaymentOrder(req.user!.id, req.params.registrationId!);
    return sendSuccess(
      res,
      result,
      result.alreadyExisted ? 'Existing payment order returned' : 'Payment order created',
      result.alreadyExisted ? 200 : 201,
    );
  }),
);

paymentRouter.post(
  '/verify',
  authenticate,
  validateBody(verifyPaymentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await verifyPayment(req.user!.id, req.body as VerifyPaymentInput);
    return sendSuccess(res, result, 'Payment verified');
  }),
);

paymentRouter.post(
  '/webhook',
  asyncHandler(async (req: Request, res: Response) => {
    if (!Buffer.isBuffer(req.body)) {
      throw new BadRequestError('Webhook payload must be the raw request body');
    }
    const signature = req.header('x-razorpay-signature');
    const eventId = req.header('x-razorpay-event-id');
    const result = await processWebhook(req.body, signature, eventId);
    return sendSuccess(res, result, 'Webhook processed');
  }),
);

paymentRouter.get(
  '/',
  authenticate,
  requirePermission('payments.read'),
  validateQuery(listPaymentsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListPaymentsQuery;
    const result = await listPayments(query.eventId, query.page, query.limit);
    return sendSuccess(res, result, 'Payments retrieved successfully');
  }),
);

paymentRouter.get(
  '/:paymentId',
  authenticate,
  validateParams(paymentIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const payment = await getPayment(req.user!, req.params.paymentId!);
    return sendSuccess(res, payment, 'Payment retrieved successfully');
  }),
);
