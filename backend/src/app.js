const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { StatusCodes } = require('http-status-codes');

const env = require('./config/env');
const CONSTANTS = require('./config/constants');
const loggerMiddleware = require('./middlewares/logger.middleware');
const correlationMiddleware = require('./middlewares/correlation.middleware');
const errorHandler = require('./middlewares/error.middleware');
const { metricsMiddleware, metricsHandler } = require('./utils/metrics');
const ApiResponse = require('./utils/ApiResponse');
const ApiError = require('./utils/ApiError');

// Route imports
const telemetryRoutes = require('./modules/telemetry/telemetry.routes');
const otelRoutes = require('./modules/telemetry/otel.routes');
const predictionRoutes = require('./modules/prediction/prediction.routes');
const serviceRoutes = require('./modules/service/service.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');

// ── Initialize Express App ──
const app = express();

// ═══════════════════════════════════════════
// MIDDLEWARE STACK
// ═══════════════════════════════════════════

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: env.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
  credentials: true,
  exposedHeaders: ['x-correlation-id'],
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request correlation tracking
app.use(correlationMiddleware);

// HTTP request logging
app.use(loggerMiddleware);

// Prometheus metrics collection
app.use(metricsMiddleware);

// Rate limiting
const shouldSkipRateLimit = (req) => {
  if (!env.isDev) {
    return false;
  }

  const requestPath = req.originalUrl || req.path || '';

  // In local/demo mode, high-frequency telemetry + dashboard polling should not be throttled.
  return (
    requestPath.startsWith('/api/v1/telemetry') ||
    requestPath.startsWith('/api/v1/dashboard') ||
    requestPath.startsWith('/api/v1/services') ||
    requestPath.startsWith('/api/v1/service') ||
    requestPath.startsWith('/api/v1/predictions')
  );
};

const limiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.maxRequests,
  skip: shouldSkipRateLimit,
  message: {
    success: false,
    message: CONSTANTS.MESSAGES.RATE_LIMIT_EXCEEDED,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ═══════════════════════════════════════════
// MONITORING ENDPOINTS
// ═══════════════════════════════════════════

app.get('/metrics', metricsHandler);

app.get('/health', (req, res) => {
  res.status(StatusCodes.OK).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.nodeEnv,
    correlationId: req.correlationId,
  });
});

// ═══════════════════════════════════════════
// API ROUTES (v1)
// ═══════════════════════════════════════════

app.use('/api/v1/telemetry', telemetryRoutes);
app.use('/v1', otelRoutes);
app.use('/api/v1/predictions', predictionRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// ── Also mount service detail at /api/v1/service/:name for spec compliance ──
app.get('/api/v1/service/:name', (req, res, next) => {
  // Forward to service routes
  req.url = `/${req.params.name}`;
  serviceRoutes(req, res, next);
});

// ═══════════════════════════════════════════
// 404 HANDLER
// ═══════════════════════════════════════════

app.use((req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
});

// ═══════════════════════════════════════════
// GLOBAL ERROR HANDLER
// ═══════════════════════════════════════════

app.use(errorHandler);

module.exports = app;
