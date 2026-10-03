export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: unknown[];

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_SERVER_ERROR',
    details: unknown[] = [],
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details: unknown[] = [], code = 'BAD_REQUEST') {
    super(message, 400, code, details);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable', details: unknown[] = []) {
    super(message, 503, 'SERVICE_UNAVAILABLE', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication is required', code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', code = 'CONFLICT') {
    super(message, 409, code);
  }
}
