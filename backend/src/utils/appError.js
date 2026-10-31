/**
 * Custom Application Error class for operational errors.
 * Distinguishes expected business/operational errors from unexpected bugs.
 */
export class AppError extends Error {
  /**
   * @param {string} message - Error description
   * @param {number} statusCode - HTTP status code
   * @param {string} [errorCode='APP_ERROR'] - Machine-readable error code
   * @param {any} [details=null] - Additional validation or contextual details
   */
  constructor(message, statusCode = 500, errorCode = 'APP_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', details = null, errorCode = 'BAD_REQUEST') {
    return new AppError(message, 400, errorCode, details);
  }

  static unauthorized(message = 'Unauthorized access', details = null, errorCode = 'UNAUTHORIZED') {
    return new AppError(message, 401, errorCode, details);
  }

  static forbidden(message = 'Access forbidden', details = null, errorCode = 'FORBIDDEN') {
    return new AppError(message, 403, errorCode, details);
  }

  static notFound(message = 'Resource not found', details = null, errorCode = 'NOT_FOUND') {
    return new AppError(message, 404, errorCode, details);
  }

  static conflict(message = 'Resource conflict', details = null, errorCode = 'CONFLICT') {
    return new AppError(message, 409, errorCode, details);
  }

  static unprocessable(message = 'Unprocessable entity', details = null, errorCode = 'UNPROCESSABLE_ENTITY') {
    return new AppError(message, 422, errorCode, details);
  }

  static internal(message = 'Internal server error', details = null, errorCode = 'INTERNAL_ERROR') {
    return new AppError(message, 500, errorCode, details);
  }
}

export default AppError;
