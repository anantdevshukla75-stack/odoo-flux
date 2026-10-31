import { Router } from 'express';
import ProductController from './product.controller.js';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';
import validate from '../../middleware/validate.js';
import optionalAuthenticate from '../../middleware/optionalAuthenticate.js';
import {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
  productQuerySchema,
  uuidParamSchema,
  productVariantParamSchema
} from './product.validator.js';

const router = Router();

// -------------------------------------------------------------
// PRODUCTS
// -------------------------------------------------------------
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate({ body: createProductSchema }),
  ProductController.createProduct
);

router.get(
  '/',
  optionalAuthenticate,
  validate({ query: productQuerySchema }),
  ProductController.listProducts
);

router.get(
  '/:id',
  optionalAuthenticate,
  validate({ params: uuidParamSchema }),
  ProductController.getProductById
);

router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: uuidParamSchema, body: updateProductSchema }),
  ProductController.updateProduct
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: uuidParamSchema }),
  ProductController.deleteProduct
);

// -------------------------------------------------------------
// PRODUCT VARIANTS (Nested under product)
// -------------------------------------------------------------
router.post(
  '/:productId/variants',
  authenticate,
  authorize('ADMIN'),
  validate({ params: productVariantParamSchema, body: createVariantSchema }),
  ProductController.createVariant
);

router.get(
  '/:productId/variants',
  optionalAuthenticate,
  validate({ params: productVariantParamSchema }),
  ProductController.listVariants
);

export default router;
