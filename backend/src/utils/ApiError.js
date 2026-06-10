const { StatusCodes, ReasonPhrases } = require('http-status-codes');

/**
 * Custom API Error class for structured error handling.
 * Extends native Error with HTTP status code and operational flag.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {boolean} [isOperational=true] - Whether error is operational (expected) vs programming error
   * @param {Array} [errors=[]] - Detailed validation errors
   * @param {string} [stack=''] - Error stack trace
   */
  constructor(statusCode, message, isOperational = true, errors = [], stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // ── Factory Methods ──

  static badRequest(message = ReasonPhrases.BAD_REQUEST, errors = []) {
    return new ApiError(StatusCodes.BAD_REQUEST, message, true, errors);
  }

  static unauthorized(message = ReasonPhrases.UNAUTHORIZED) {
    return new ApiError(StatusCodes.UNAUTHORIZED, message);
  }

  static forbidden(message = ReasonPhrases.FORBIDDEN) {
    return new ApiError(StatusCodes.FORBIDDEN, message);
  }

  static notFound(message = ReasonPhrases.NOT_FOUND) {
    return new ApiError(StatusCodes.NOT_FOUND, message);
  }

  static conflict(message = ReasonPhrases.CONFLICT) {
    return new ApiError(StatusCodes.CONFLICT, message);
  }

  static tooManyRequests(message = 'Too many requests, please try again later') {
    return new ApiError(StatusCodes.TOO_MANY_REQUESTS, message);
  }

  static internal(message = ReasonPhrases.INTERNAL_SERVER_ERROR) {
    return new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, message, false);
  }

  static serviceUnavailable(message = ReasonPhrases.SERVICE_UNAVAILABLE) {
    return new ApiError(StatusCodes.SERVICE_UNAVAILABLE, message);
  }
}

module.exports = ApiError;
