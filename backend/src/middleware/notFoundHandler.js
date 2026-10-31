import AppError from '../utils/appError.js';

/**
 * 404 Route Not Found middleware
 */
export function notFoundHandler(req, res, next) {
  const message = `Route not found: ${req.method} ${req.originalUrl}`;
  next(AppError.notFound(message, null, 'ROUTE_NOT_FOUND'));
}

export default notFoundHandler;
