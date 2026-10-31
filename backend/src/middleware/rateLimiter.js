import rateLimit from 'express-rate-limit';
import env from '../config/environment.js';
import ApiResponse from '../utils/apiResponse.js';

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test', // Skip rate limiting during test executions
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      'Too many requests from this IP. Please try again later.',
      429,
      null,
      'TOO_MANY_REQUESTS'
    );
  }
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // strict limit for sensitive auth actions (login/reset)
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      'Too many authentication attempts. Please try again after 15 minutes.',
      429,
      null,
      'AUTH_RATE_LIMIT_EXCEEDED'
    );
  }
});

export default globalRateLimiter;
