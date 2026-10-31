import PlanService from './plan.service.js';
import ApiResponse from '../../utils/apiResponse.js';

export class PlanController {
  /**
   * POST /api/v1/plans
   */
  static async createPlan(req, res, next) {
    try {
      const plan = await PlanService.createPlan(req.body, req.user);
      return ApiResponse.created(res, 'Subscription plan created successfully.', plan);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/plans
   */
  static async listPlans(req, res, next) {
    try {
      const result = await PlanService.listPlans(req.query, req.user);
      return ApiResponse.success(res, 'Subscription plans retrieved successfully.', result.plans, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/plans/:id
   */
  static async getPlanById(req, res, next) {
    try {
      const plan = await PlanService.getPlanById(req.params.id, req.user);
      return ApiResponse.success(res, 'Subscription plan retrieved successfully.', plan);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/plans/:id
   */
  static async updatePlan(req, res, next) {
    try {
      const updated = await PlanService.updatePlan(req.params.id, req.body, req.user);
      return ApiResponse.success(res, 'Subscription plan updated successfully.', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/plans/:id
   */
  static async deletePlan(req, res, next) {
    try {
      const deactivated = await PlanService.deletePlan(req.params.id, req.user);
      return ApiResponse.success(res, 'Subscription plan archived/deactivated successfully.', deactivated);
    } catch (error) {
      next(error);
    }
  }
}

export default PlanController;
