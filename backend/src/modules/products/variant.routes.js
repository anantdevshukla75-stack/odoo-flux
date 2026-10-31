import { Router } from 'express';
import ProductController from './product.controller.js';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';
import validate from '../../middleware/validate.js';
import { updateVariantSchema, uuidParamSchema } from './product.validator.js';

const router = Router();

router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: uuidParamSchema, body: updateVariantSchema }),
  ProductController.updateVariant
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: uuidParamSchema }),
  ProductController.deleteVariant
);

export default router;
