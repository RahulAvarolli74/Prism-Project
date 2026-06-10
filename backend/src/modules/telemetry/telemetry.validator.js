const { body, query, param } = require('express-validator');

/**
 * Telemetry Validation Chains
 */
const telemetryValidations = {
  /**
   * Validation for POST /telemetry (ingestion).
   * Flexible — only requires service_name; everything else is optional.
   */
  ingest: [
    body()
      .custom((value) => {
        // Support both single object and array of telemetry payloads
        if (typeof value !== 'object') {
          throw new Error('Request body must be an object or array');
        }
        return true;
      }),

    body('service_name')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('service_name must be a non-empty string'),

    body('serviceName')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('serviceName must be a non-empty string'),

    // At least one of service_name or serviceName must be present
    body()
      .custom((value) => {
        if (!value.service_name && !value.serviceName) {
          throw new Error('Either service_name or serviceName is required');
        }
        return true;
      }),

    body('timestamp')
      .optional()
      .isISO8601()
      .withMessage('timestamp must be a valid ISO 8601 date string'),

    body('metrics')
      .optional()
      .isObject()
      .withMessage('metrics must be an object'),

    body('metrics.cpu')
      .optional()
      .isNumeric()
      .withMessage('metrics.cpu must be a number'),

    body('metrics.memory')
      .optional()
      .isNumeric()
      .withMessage('metrics.memory must be a number'),

    body('metrics.latency')
      .optional()
      .isNumeric()
      .withMessage('metrics.latency must be a number'),

    body('metrics.error_rate')
      .optional()
      .isNumeric()
      .withMessage('metrics.error_rate must be a number'),

    body('logs')
      .optional()
      .custom((value) => {
        if (!Array.isArray(value) && typeof value !== 'string') {
          throw new Error('logs must be an array or string');
        }
        return true;
      }),

    body('trace')
      .optional()
      .isObject()
      .withMessage('trace must be an object'),
  ],

  /**
   * Validation for GET /telemetry (list with filters).
   */
  list: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('page must be a positive integer'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),

    query('serviceName')
      .optional()
      .isString()
      .trim()
      .withMessage('serviceName must be a string'),

    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('startDate must be a valid ISO 8601 date'),

    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('endDate must be a valid ISO 8601 date'),
  ],

  /**
   * Validation for GET /telemetry/:id
   */
  getById: [
    param('id')
      .isUUID()
      .withMessage('id must be a valid UUID'),
  ],
};

telemetryValidations.otel = [
  body().custom((value) => {
    if (!value || typeof value !== 'object') {
      throw new Error('Request body must be an object');
    }
    return true;
  }),
];

module.exports = telemetryValidations;
