import TaxAdminService from './tax.service.js';
import ApiResponse from '../../utils/apiResponse.js';

export class TaxController {
  /**
   * POST /api/v1/taxes
   */
  static async createTax(req, res, next) {
    try {
      const tax = await TaxAdminService.createTax(req.body, req.user);
      return ApiResponse.created(res, 'Tax rule created successfully.', tax);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/taxes
   */
  static async listTaxes(req, res, next) {
    try {
      const result = await TaxAdminService.listTaxes(req.query, req.user);
      return ApiResponse.success(res, 'Tax rules retrieved successfully.', result.taxes, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/taxes/:id
   */
  static async getTaxById(req, res, next) {
    try {
      const tax = await TaxAdminService.getTaxById(req.params.id);
      return ApiResponse.success(res, 'Tax rule retrieved successfully.', tax);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/taxes/:id
   */
  static async updateTax(req, res, next) {
    try {
      const updated = await TaxAdminService.updateTax(req.params.id, req.body, req.user);
      return ApiResponse.success(res, 'Tax rule updated successfully.', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/taxes/:id
   */
  static async deleteTax(req, res, next) {
    try {
      const deactivated = await TaxAdminService.deleteTax(req.params.id, req.user);
      return ApiResponse.success(res, 'Tax rule archived/deactivated successfully.', deactivated);
    } catch (error) {
      next(error);
    }
  }
}

export default TaxController;
