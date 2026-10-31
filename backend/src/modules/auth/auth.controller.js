import AuthService from './auth.service.js';
import ApiResponse from '../../utils/apiResponse.js';

export class AuthController {
  /**
   * POST /api/v1/auth/register
   */
  static async register(req, res, next) {
    try {
      const result = await AuthService.registerCustomer(req.body);
      return ApiResponse.created(res, 'Customer account registered successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      return ApiResponse.success(res, 'Authentication successful.', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  static async logout(req, res, next) {
    try {
      const refreshToken = req.body?.refreshToken;
      await AuthService.logout(req.user.id, refreshToken);
      return ApiResponse.success(res, 'Logged out successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/refresh-token
   */
  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshTokens(refreshToken);
      return ApiResponse.success(res, 'Tokens refreshed successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  static async getMe(req, res, next) {
    try {
      const result = await AuthService.getMe(req.user.id);
      return ApiResponse.success(res, 'User profile retrieved successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/forgot-password
   */
  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await AuthService.requestPasswordReset(email);
      return ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/reset-password
   */
  static async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      const result = await AuthService.resetPassword(token, password);
      return ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
