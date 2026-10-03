import { Router, Request, Response } from 'express';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import { usersRouter } from './users.routes.js';
import { adminRouter } from './admin.routes.js';
import { membershipRouter } from './membership.routes.js';
import { eventRouter } from './event.routes.js';
import { eventRegistrationRouter, registrationRouter } from './registration.routes.js';
import { eventTicketRouter, ticketRouter } from './ticket.routes.js';
import { paymentRouter, registrationPaymentRouter } from './payment.routes.js';
import { sendSuccess } from '../utils/response.js';

export const rootRouter = Router();

// Mount Health and Readiness probes under /health
rootRouter.use('/health', healthRouter);
rootRouter.use('/auth', authRouter);
rootRouter.use('/users', usersRouter);
rootRouter.use('/admin', adminRouter);
rootRouter.use('/memberships', membershipRouter);
rootRouter.use('/events', eventRouter);
rootRouter.use('/events', eventRegistrationRouter);
rootRouter.use('/events', eventTicketRouter);
rootRouter.use('/registrations', registrationRouter);
rootRouter.use('/registrations', registrationPaymentRouter);
rootRouter.use('/payments', paymentRouter);
rootRouter.use('/tickets', ticketRouter);

/**
 * GET /api
 * Root API service information endpoint.
 */
rootRouter.get('/', (_req: Request, res: Response) => {
  return sendSuccess(
    res,
    {
      name: 'CampusFlow API',
      version: '0.1.0',
      phase: '00-foundation',
      docs: '/api/docs',
    },
    'CampusFlow API is online',
    200,
  );
});
