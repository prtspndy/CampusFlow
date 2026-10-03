import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';

interface SyntaxErrorWithStatus extends SyntaxError {
  status?: number;
  body?: string;
}

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const correlationId = req.id || 'unknown';

  // 1. Handled Application Errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // 2. Malformed JSON Body Error from express.json()
  const syntaxErr = err as SyntaxErrorWithStatus;
  if (syntaxErr instanceof SyntaxError && syntaxErr.status === 400 && 'body' in syntaxErr) {
    res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Malformed JSON payload in request body',
        details: [],
      },
    });
    return;
  }

  // 3. Schema / Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedDetails = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Payload validation failed',
        details: formattedDetails,
      },
    });
    return;
  }

  // 4. Uncaught / Unexpected Server Errors (500)
  // Safe server-side log containing correlation ID, message, and stack
  console.error(`[ERROR] [Req-ID: ${correlationId}] Unhandled Error:`, {
    message: err.message,
    name: err.name,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Client response is completely sanitized: no stack traces or raw details
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred. Please contact support.',
      details: [],
    },
  });
};
