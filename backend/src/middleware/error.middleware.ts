// ══════════════════════════════════════════════════════════════
// PeakPack — Global Error Handler Middleware
// ══════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

/**
 * Custom AppError class for throwing typed errors within the app.
 */
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error factories
export const errors = {
  badRequest: (message: string, code = 'BAD_REQUEST') =>
    new AppError(message, 400, code),

  unauthorized: (message = 'Unauthorized', code = 'UNAUTHORIZED') =>
    new AppError(message, 401, code),

  forbidden: (message = 'Forbidden', code = 'FORBIDDEN') =>
    new AppError(message, 403, code),

  notFound: (message = 'Resource not found', code = 'NOT_FOUND') =>
    new AppError(message, 404, code),

  conflict: (message: string, code = 'CONFLICT') =>
    new AppError(message, 409, code),

  validation: (message: string, code = 'VALIDATION_ERROR') =>
    new AppError(message, 422, code),

  internal: (message = 'Internal server error', code = 'INTERNAL_ERROR') =>
    new AppError(message, 500, code),
};

/**
 * Global error handler — catches all thrown errors.
 * Must be registered LAST in middleware chain (after all routes).
 */
export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default to 500 for unknown errors
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
  } else if (err.name === 'PrismaClientKnownRequestError') {
    // Handle common Prisma errors
    const prismaError = err as any;
    switch (prismaError.code) {
      case 'P2002': // Unique constraint violation
        statusCode = 409;
        message = 'A record with this value already exists';
        code = 'CONFLICT';
        break;
      case 'P2025': // Record not found
        statusCode = 404;
        message = 'Record not found';
        code = 'NOT_FOUND';
        break;
      default:
        statusCode = 400;
        message = 'Database operation failed';
        code = 'DB_ERROR';
    }
  } else if (err.name === 'SyntaxError' && 'body' in err) {
    // JSON parse error
    statusCode = 400;
    message = 'Invalid JSON in request body';
    code = 'INVALID_JSON';
  }

  // Log server errors
  if (statusCode >= 500) {
    logger.error('Server error', {
      message: err.message,
      stack: err.stack,
      statusCode,
      code,
    });
  } else if (statusCode >= 400) {
    logger.debug('Client error', {
      message: err.message,
      statusCode,
      code,
    });
  }

  res.status(statusCode).json({
    error: { message, code },
  });
}
