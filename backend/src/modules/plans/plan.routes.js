import { Router } from 'express';
import PlanController from './plan.controller.js';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';
import validate from '../../middleware/validate.js';
import optionalAuthenticate from '../../middleware/optionalAuthenticate.js';
import {
  createPlanSchema,
  updatePlanSchema,
  planQuerySchema,
  uuidParamSchema
} from './plan.validator.js';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate({ body: createPlanSchema }),
  PlanController.createPlan
);

router.get(
  '/',
  optionalAuthenticate,
  validate({ query: planQuerySchema }),
  PlanController.listPlans
);

router.get(
  '/:id',
  optionalAuthenticate,
  validate({ params: uuidParamSchema }),
  PlanController.getPlanById
);

router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: uuidParamSchema, body: updatePlanSchema }),
  PlanController.updatePlan
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: uuidParamSchema }),
  PlanController.deletePlan
);

export default router;
