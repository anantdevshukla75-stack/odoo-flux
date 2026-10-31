/**
 * Standardized API response helpers to maintain consistent JSON envelopes
 */
export class ApiResponse {
  /**
   * Send success response
   * @param {import('express').Response} res
   * @param {string} message
   * @param {any} data
   * @param {number} statusCode
   * @param {object} meta
   */
  static success(res, message = 'Success', data = {}, statusCode = 200, meta = undefined) {
    const payload = {
      success: true,
      message,
      data
    };

    if (meta !== undefined) {
      payload.meta = meta;
    }

    return res.status(statusCode).json(payload);
  }

  /**
   * Send created (201) response
   * @param {import('express').Response} res
   * @param {string} message
   * @param {any} data
   * @param {object} meta
   */
  static created(res, message = 'Resource created successfully', data = {}, meta = undefined) {
    return ApiResponse.success(res, message, data, 201, meta);
  }

  /**
   * Send error response
   * @param {import('express').Response} res
   * @param {string} message
   * @param {number} statusCode
   * @param {Array|object} errors
   * @param {string} errorCode
   */
  static error(res, message = 'An error occurred', statusCode = 500, errors = null, errorCode = 'ERROR') {
    const payload = {
      success: false,
      message,
      code: errorCode
    };

    if (errors !== null) {
      payload.errors = errors;
    }

    return res.status(statusCode).json(payload);
  }
}

export default ApiResponse;
