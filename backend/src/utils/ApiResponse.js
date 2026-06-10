const { StatusCodes } = require('http-status-codes');

/**
 * Standardized API Response wrapper.
 * Ensures all API responses follow a consistent structure.
 */
class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {*} data - Response payload
   * @param {string} message - Human-readable message
   * @param {object} [meta={}] - Additional metadata (pagination, etc.)
   */
  constructor(statusCode, data, message = 'Success', meta = {}) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.meta = Object.keys(meta).length > 0 ? meta : undefined;
  }

  // ── Factory Methods ──

  /**
   * 200 OK
   */
  static success(data, message = 'Success') {
    return new ApiResponse(StatusCodes.OK, data, message);
  }

  /**
   * 201 Created
   */
  static created(data, message = 'Resource created successfully') {
    return new ApiResponse(StatusCodes.CREATED, data, message);
  }

  /**
   * 200 OK with pagination metadata
   */
  static paginated(data, pagination, message = 'Success') {
    return new ApiResponse(StatusCodes.OK, data, message, { pagination });
  }

  /**
   * Error response
   */
  static error(statusCode, message, errors = []) {
    const response = new ApiResponse(statusCode, null, message);
    if (errors.length > 0) {
      response.errors = errors;
    }
    return response;
  }

  /**
   * Send this response via Express res object
   * @param {import('express').Response} res
   */
  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
      ...(this.meta && { meta: this.meta }),
      ...(this.errors && { errors: this.errors }),
    });
  }
}

module.exports = ApiResponse;
