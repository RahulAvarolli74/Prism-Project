const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const env = require('../config/env');

// ── Log Format ──
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `[${timestamp}] ${level.toUpperCase().padEnd(7)} ${message}${metaStr}${stackStr}`;
  })
);

// ── JSON Format for production ──
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// ── Transports ──
const transports = [
  // Console — always active
  new winston.transports.Console({
    format: env.isProd ? jsonFormat : winston.format.combine(
      winston.format.colorize(),
      logFormat
    ),
  }),
];

// File transports — only in non-test environments
if (env.nodeEnv !== 'test') {
  // Combined log — all levels
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: path.resolve(__dirname, '../../logs/combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: env.isProd ? jsonFormat : logFormat,
    })
  );

  // Error log — errors only
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: path.resolve(__dirname, '../../logs/error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      format: env.isProd ? jsonFormat : logFormat,
    })
  );
}

// ── Logger Instance ──
const logger = winston.createLogger({
  level: env.logLevel,
  defaultMeta: { service: 'prism-backend' },
  transports,
  // Don't exit on uncaught exceptions — let the process handler deal with it
  exitOnError: false,
});

// ── Stream for Morgan HTTP logger ──
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = logger;
