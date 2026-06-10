const { Prisma } = require('@prisma/client');
const { StatusCodes } = require('http-status-codes');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');
const env = require('../config/env');

/**
 * Global error handling middleware.
 * Catches all errors thrown in routes/controllers and returns structured responses.
 *
 * Handles:
 * - Custom ApiError instances
 * - Prisma ORM errors (unique constraint, not found, etc.)
 * - Express-validator errors
 * - Unknown/unhandled errors
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  // ── Handle Prisma Errors ──
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': // Unique constraint violation
        error = ApiError.conflict(
          `Duplicate value for field: ${err.meta?.target?.join(', ') || 'unknown'}`
        );
        break;
      case 'P2025': // Record not found
        error = ApiError.notFound('Requested record not found');
        break;
      case 'P2003': // Foreign key constraint violation
        error = ApiError.badRequest('Related record not found (foreign key constraint)');
        break;
      default:
        error = ApiError.internal(`Database error: ${err.code}`);
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    error = ApiError.badRequest('Invalid data provided to the database');
  }

  // ── Handle express-validator errors ──
  if (err.array && typeof err.array === 'function') {
    error = ApiError.badRequest('Validation failed', err.array());
  }

  // ── Ensure error is an ApiError ──
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, false, [], err.stack);
  }

  // ── Log the error ──
  if (error.statusCode >= 500) {
    logger.error(`[${error.statusCode}] ${error.message}`, {
      path: req.originalUrl,
      method: req.method,
      stack: env.isDev ? error.stack : undefined,
    });
  } else {
    logger.warn(`[${error.statusCode}] ${error.message}`, {
      path: req.originalUrl,
      method: req.method,
    });
  }

  // ── Build response ──
  const response = {
    success: false,
    message: error.message,
    ...(error.errors.length > 0 && { errors: error.errors }),
    ...(env.isDev && { stack: error.stack }),
  };

  return res.status(error.statusCode).json(response);
};

module.exports = errorHandler;
