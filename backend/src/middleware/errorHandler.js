import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import AppError from '../utils/appError.js';
import ApiResponse from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import env from '../config/environment.js';

/**
 * Centralized Express Error Handling Middleware
 */
export function errorHandler(err, req, res, next) {
  // If response headers already sent, delegate to standard Express handler
  if (res.headersSent) {
    return next(err);
  }

  const isProduction = env.NODE_ENV === 'production';

  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
      rule: e.code
    }));

    return ApiResponse.error(
      res,
      'Validation failed for incoming request data',
      400,
      formattedErrors,
      'VALIDATION_ERROR'
    );
  }

  // 2. Custom Application Operational Errors
  if (err instanceof AppError) {
    return ApiResponse.error(
      res,
      err.message,
      err.statusCode,
      err.details,
      err.errorCode
    );
  }

  // 3. Prisma Database Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : (err.meta?.target || 'field');
        return ApiResponse.error(
          res,
          `A record with this ${target} already exists.`,
          409,
          { target },
          'UNIQUE_CONSTRAINT_VIOLATION'
        );
      }
      case 'P2025': {
        return ApiResponse.error(
          res,
          'The requested record does not exist or has already been removed.',
          404,
          null,
          'RECORD_NOT_FOUND'
        );
      }
      case 'P2003': {
        return ApiResponse.error(
          res,
          'Foreign key constraint violation.',
          400,
          null,
          'FOREIGN_KEY_VIOLATION'
        );
      }
      default: {
        logger.error({ code: err.code, meta: err.meta, message: err.message }, 'Prisma error');
        return ApiResponse.error(
          res,
          'Database operation failed.',
          500,
          null,
          'DATABASE_ERROR'
        );
      }
    }
  }

  // 4. Bad JSON payload / Syntax Error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return ApiResponse.error(
      res,
      'Malformed JSON payload received.',
      400,
      null,
      'INVALID_JSON'
    );
  }

  // 5. Unexpected / Unhandled Internal Errors
  logger.error(
    {
      err: {
        message: err.message,
        stack: err.stack,
        name: err.name
      },
      url: req.originalUrl,
      method: req.method
    },
    'Unhandled server error occurred'
  );

  const message = isProduction ? 'Internal Server Error' : err.message;
  const errors = isProduction ? null : { stack: err.stack };

  return ApiResponse.error(
    res,
    message,
    500,
    errors,
    'INTERNAL_SERVER_ERROR'
  );
}

export default errorHandler;
