import { Router } from 'express';
import UserController from './user.controller.js';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';
import validate from '../../middleware/validate.js';
import {
  createStaffSchema,
  updateUserSchema,
  updateCustomerProfileSchema,
  userQuerySchema,
  uuidParamSchema
} from './user.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// -------------------------------------------------------------
// STAFF CREATION (ADMIN ONLY)
// -------------------------------------------------------------
router.post(
  '/staff',
  authorize('ADMIN'),
  validate({ body: createStaffSchema }),
  UserController.createStaff
);

// -------------------------------------------------------------
// CUSTOMER DIRECTORY (ADMIN & STAFF)
// -------------------------------------------------------------
router.get(
  '/customers',
  authorize('ADMIN', 'STAFF'),
  validate({ query: userQuerySchema }),
  UserController.listCustomers
);

router.get(
  '/customers/:id',
  validate({ params: uuidParamSchema }),
  UserController.getCustomerProfile
);

router.put(
  '/customers/:id',
  validate({ params: uuidParamSchema, body: updateCustomerProfileSchema }),
  UserController.updateCustomerProfile
);

// -------------------------------------------------------------
// USER MANAGEMENT (ADMIN & STAFF)
// -------------------------------------------------------------
router.get(
  '/',
  authorize('ADMIN', 'STAFF'),
  validate({ query: userQuerySchema }),
  UserController.listUsers
);

router.get(
  '/:id',
  validate({ params: uuidParamSchema }),
  UserController.getUserById
);

router.patch(
  '/:id',
  validate({ params: uuidParamSchema, body: updateUserSchema }),
  UserController.updateUser
);

// Activate / Deactivate account (ADMIN ONLY)
router.patch(
  '/:id/status',
  authorize('ADMIN'),
  validate({ params: uuidParamSchema }),
  UserController.setUserStatus
);

export default router;
