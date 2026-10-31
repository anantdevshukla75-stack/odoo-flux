import { Router } from 'express';
import TaxController from './tax.controller.js';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';
import validate from '../../middleware/validate.js';
import optionalAuthenticate from '../../middleware/optionalAuthenticate.js';
import {
  createTaxSchema,
  updateTaxSchema,
  taxQuerySchema,
  uuidParamSchema
} from './tax.validator.js';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate({ body: createTaxSchema }),
  TaxController.createTax
);

router.get(
  '/',
  optionalAuthenticate,
  validate({ query: taxQuerySchema }),
  TaxController.listTaxes
);

router.get(
  '/:id',
  optionalAuthenticate,
  validate({ params: uuidParamSchema }),
  TaxController.getTaxById
);

router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: uuidParamSchema, body: updateTaxSchema }),
  TaxController.updateTax
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: uuidParamSchema }),
  TaxController.deleteTax
);

export default router;
