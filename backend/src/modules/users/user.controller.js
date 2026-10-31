import UserService from './user.service.js';
import ApiResponse from '../../utils/apiResponse.js';

export class UserController {
  /**
   * POST /api/v1/users/staff
   * (ADMIN only)
   */
  static async createStaff(req, res, next) {
    try {
      const result = await UserService.createStaff(req.body, req.user);
      return ApiResponse.created(res, 'Staff account created successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users
   * (ADMIN & STAFF)
   */
  static async listUsers(req, res, next) {
    try {
      const result = await UserService.listUsers(req.query, req.user);
      return ApiResponse.success(res, 'Users retrieved successfully.', result.users, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users/:id
   */
  static async getUserById(req, res, next) {
    try {
      const user = await UserService.getUserById(req.params.id, req.user);
      return ApiResponse.success(res, 'User retrieved successfully.', user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/users/:id
   */
  static async updateUser(req, res, next) {
    try {
      const updated = await UserService.updateUser(req.params.id, req.body, req.user);
      return ApiResponse.success(res, 'User updated successfully.', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/users/:id/status
   * (ADMIN only)
   */
  static async setUserStatus(req, res, next) {
    try {
      const { isActive } = req.body;
      const updated = await UserService.setUserStatus(req.params.id, isActive, req.user);
      return ApiResponse.success(
        res,
        `User account ${isActive ? 'activated' : 'deactivated'} successfully.`,
        updated
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users/customers
   * (ADMIN & STAFF)
   */
  static async listCustomers(req, res, next) {
    try {
      const result = await UserService.listCustomers(req.query);
      return ApiResponse.success(res, 'Customers retrieved successfully.', result.customers, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users/customers/:id
   */
  static async getCustomerProfile(req, res, next) {
    try {
      const customer = await UserService.getCustomerProfile(req.params.id, req.user);
      return ApiResponse.success(res, 'Customer profile retrieved successfully.', customer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/users/customers/:id
   */
  static async updateCustomerProfile(req, res, next) {
    try {
      const updated = await UserService.updateCustomerProfile(req.params.id, req.body, req.user);
      return ApiResponse.success(res, 'Customer profile updated successfully.', updated);
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
