import { Router } from 'express';
import AuthController from './auth.controller.js';
import validate from '../../middleware/validate.js';
import authenticate from '../../middleware/authenticate.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema
} from './auth.validator.js';

const router = Router();

// Public Authentication Endpoints
router.post(
  '/register',
  authRateLimiter,
  validate({ body: registerSchema }),
  AuthController.register
);

router.post(
  '/login',
  authRateLimiter,
  validate({ body: loginSchema }),
  AuthController.login
);

router.post(
  '/refresh-token',
  validate({ body: refreshTokenSchema }),
  AuthController.refreshToken
);

router.post(
  '/forgot-password',
  authRateLimiter,
  validate({ body: forgotPasswordSchema }),
  AuthController.forgotPassword
);

router.post(
  '/reset-password',
  authRateLimiter,
  validate({ body: resetPasswordSchema }),
  AuthController.resetPassword
);

// Authenticated Endpoints
router.get(
  '/me',
  authenticate,
  AuthController.getMe
);

router.post(
  '/logout',
  authenticate,
  AuthController.logout
);

export default router;
