const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Request Correlation ID Middleware
 * Assigns a unique ID to each request for distributed tracing and debugging
 * Logs all request/response with correlation ID
 */
const correlationMiddleware = (req, res, next) => {
  // Extract correlation ID from headers or generate new one
  const correlationId = req.headers['x-correlation-id'] || uuidv4();

  // Store in request for access throughout lifecycle
  req.correlationId = correlationId;
  req.startTime = Date.now();

  // Add to response headers for client tracking
  res.setHeader('x-correlation-id', correlationId);

  // Log request
  logger.debug('Incoming Request', {
    correlationId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Intercept response to log duration
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - req.startTime;

    logger.debug('Outgoing Response', {
      correlationId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });

    return originalSend.call(this, data);
  };

  next();
};

module.exports = correlationMiddleware;
