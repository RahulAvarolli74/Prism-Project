const morgan = require('morgan');
const logger = require('../utils/logger');
const env = require('../config/env');

/**
 * HTTP request logging middleware using Morgan.
 * 
 * - Development: Colorized, concise dev format
 * - Production: Combined format piped through Winston for structured logging
 */

// Custom token for response time with unit
morgan.token('response-time-ms', (req, res) => {
  const time = morgan['response-time'](req, res);
  return time ? `${time}ms` : '-';
});

// Skip health check endpoint from logs to reduce noise
const skip = (req) => {
  return req.url === '/health' || req.url === '/favicon.ico';
};

let loggerMiddleware;

if (env.isDev) {
  loggerMiddleware = morgan('dev', { skip });
} else {
  loggerMiddleware = morgan(
    ':remote-addr :method :url :status :response-time-ms - :res[content-length]',
    {
      stream: logger.stream,
      skip,
    }
  );
}

module.exports = loggerMiddleware;
