import ProductService from './product.service.js';
import ApiResponse from '../../utils/apiResponse.js';

export class ProductController {
  /**
   * POST /api/v1/products
   */
  static async createProduct(req, res, next) {
    try {
      const product = await ProductService.createProduct(req.body, req.user);
      return ApiResponse.created(res, 'Product created successfully.', product);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/products
   */
  static async listProducts(req, res, next) {
    try {
      const result = await ProductService.listProducts(req.query, req.user);
      return ApiResponse.success(res, 'Products retrieved successfully.', result.products, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/products/:id
   */
  static async getProductById(req, res, next) {
    try {
      const product = await ProductService.getProductById(req.params.id, req.user);
      return ApiResponse.success(res, 'Product retrieved successfully.', product);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/products/:id
   */
  static async updateProduct(req, res, next) {
    try {
      const updated = await ProductService.updateProduct(req.params.id, req.body, req.user);
      return ApiResponse.success(res, 'Product updated successfully.', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/products/:id
   */
  static async deleteProduct(req, res, next) {
    try {
      const deactivated = await ProductService.deleteProduct(req.params.id, req.user);
      return ApiResponse.success(res, 'Product archived/deactivated successfully.', deactivated);
    } catch (error) {
      next(error);
    }
  }

  // -------------------------------------------------------------
  // VARIANTS
  // -------------------------------------------------------------

  /**
   * POST /api/v1/products/:productId/variants
   */
  static async createVariant(req, res, next) {
    try {
      const variant = await ProductService.createVariant(req.params.productId, req.body, req.user);
      return ApiResponse.created(res, 'Product variant created successfully.', variant);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/products/:productId/variants
   */
  static async listVariants(req, res, next) {
    try {
      const variants = await ProductService.listVariants(req.params.productId, req.user);
      return ApiResponse.success(res, 'Product variants retrieved successfully.', variants);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/variants/:id
   */
  static async updateVariant(req, res, next) {
    try {
      const updated = await ProductService.updateVariant(req.params.id, req.body, req.user);
      return ApiResponse.success(res, 'Product variant updated successfully.', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/variants/:id
   */
  static async deleteVariant(req, res, next) {
    try {
      const deactivated = await ProductService.deleteVariant(req.params.id, req.user);
      return ApiResponse.success(res, 'Product variant archived/deactivated successfully.', deactivated);
    } catch (error) {
      next(error);
    }
  }
}

export default ProductController;
