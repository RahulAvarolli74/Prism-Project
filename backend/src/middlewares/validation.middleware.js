const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Validation middleware factory.
 * Runs express-validator chains and returns structured errors if validation fails.
 *
 * @param {Array} validations - Array of express-validator validation chains
 * @returns {Function} Express middleware
 *
 * @example
 * router.post('/telemetry',
 *   validate(telemetryValidations),
 *   telemetryController.ingest
 * );
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations in parallel
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);

    if (errors.isEmpty()) {
      return next();
    }

    // Format errors for consistent API response
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
      location: err.location,
    }));

    throw ApiError.badRequest('Validation failed', formattedErrors);
  };
};

module.exports = validate;
