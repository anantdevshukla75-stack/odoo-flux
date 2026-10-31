import HealthService from './health.service.js';
import ApiResponse from '../../utils/apiResponse.js';

export class HealthController {
  /**
   * GET /api/v1/health
   */
  static async check(req, res, next) {
    try {
      const healthData = await HealthService.getSystemHealth();
      const statusCode = healthData.status === 'healthy' ? 200 : 503;

      return ApiResponse.success(
        res,
        `System is currently ${healthData.status}`,
        healthData,
        statusCode
      );
    } catch (error) {
      next(error);
    }
  }
}

export default HealthController;
