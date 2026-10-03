import express, { Express } from 'express';
import helmet from 'helmet';
import cors, { CorsOptions } from 'cors';
import crypto from 'node:crypto';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { rootRouter } from './routes/index.js';
import { notFoundMiddleware } from './middleware/not-found.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { openApiSpec } from './docs/swagger.js';

export function createApp(): Express {
  const app = express();

  // 1. Security Headers via Helmet
  // Configured to permit Swagger UI in development while enforcing standard protections
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    }),
  );

  // 2. CORS Configuration
  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // Allow server-to-server, curl, Postman, and mobile clients with no origin header
      if (!origin) {
        return callback(null, true);
      }
      if (env.allowedOrigins.includes('*') || env.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin '${origin}' not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  };
  app.use(cors(corsOptions));

  // 3. Request Correlation ID
  app.use((req, res, next) => {
    const incomingId = req.headers['x-request-id'];
    const correlationId =
      typeof incomingId === 'string' && incomingId.trim().length > 0
        ? incomingId
        : crypto.randomUUID();

    req.id = correlationId;
    res.setHeader('X-Request-Id', correlationId);
    next();
  });

  // 4. Body parsers. The Razorpay webhook needs the exact raw bytes for signature
  // verification, so that one path is parsed before the JSON parser runs.
  app.use(`${env.API_PREFIX}/payments/webhook`, express.raw({ type: '*/*', limit: '100kb' }));
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // 5. Safe HTTP Access Logging (suppressed in test environment)
  if (env.NODE_ENV !== 'test') {
    app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(
          `[HTTP] [${req.id}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`,
        );
      });
      next();
    });
  }

  // 6. Interactive API Documentation (OpenAPI / Swagger UI)
  app.use(`${env.API_PREFIX}/docs`, swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.get(`${env.API_PREFIX}/docs.json`, (_req, res) => {
    res.json(openApiSpec);
  });

  // 7. Mount Centralized API Routes
  app.use(env.API_PREFIX, rootRouter);

  // 8. 404 Handler for Unmatched Endpoints
  app.use(notFoundMiddleware);

  // 9. Centralized Error Handler
  app.use(errorMiddleware);

  return app;
}

export const app = createApp();
