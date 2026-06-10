const prometheus = require('prom-client');
const logger = require('./logger');

/**
 * Prometheus Metrics Configuration
 * Tracks application performance, errors, and business metrics
 */

// Create a Registry
const register = new prometheus.Registry();

// Default metrics (CPU, memory, event loop lag, etc.)
prometheus.collectDefaultMetrics({ register });

// ═════════════════════════════════════════════════
// HTTP METRICS
// ═════════════════════════════════════════════════

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const httpErrorsTotal = new prometheus.Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// ═════════════════════════════════════════════════
// DATABASE METRICS
// ═════════════════════════════════════════════════

const databaseQueryDuration = new prometheus.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

const databaseErrorsTotal = new prometheus.Counter({
  name: 'database_errors_total',
  help: 'Total number of database errors',
  labelNames: ['operation', 'model'],
  registers: [register],
});

// ═════════════════════════════════════════════════
// BUSINESS METRICS
// ═════════════════════════════════════════════════

const telemetryPointsIngested = new prometheus.Counter({
  name: 'telemetry_points_ingested_total',
  help: 'Total number of telemetry points ingested',
  labelNames: ['service'],
  registers: [register],
});

const predictionsGenerated = new prometheus.Counter({
  name: 'predictions_generated_total',
  help: 'Total number of predictions generated',
  labelNames: ['service'],
  registers: [register],
});

const predictionConfidence = new prometheus.Histogram({
  name: 'prediction_confidence',
  help: 'Distribution of prediction confidence scores',
  buckets: [0.1, 0.3, 0.5, 0.7, 0.9, 0.95, 0.99],
  registers: [register],
});

const circuitBreakerState = new prometheus.Gauge({
  name: 'circuit_breaker_state',
  help: 'Circuit breaker state (0=CLOSED, 1=OPEN, 2=HALF_OPEN)',
  labelNames: ['service'],
  registers: [register],
});

// ═════════════════════════════════════════════════
// MIDDLEWARE
// ═════════════════════════════════════════════════

/**
 * HTTP metrics middleware
 * Records request duration and counts
 */
function metricsMiddleware(req, res, next) {
  const start = Date.now();

  // Normalize route for metrics
  let route = req.path;
  if (req.route?.path) {
    route = req.route.path;
  }

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;

    httpRequestDuration.labels(req.method, route, res.statusCode).observe(duration);
    httpRequestTotal.labels(req.method, route, res.statusCode).inc();

    if (res.statusCode >= 400) {
      httpErrorsTotal.labels(req.method, route, res.statusCode).inc();
    }
  });

  next();
}

/**
 * Update circuit breaker state metric
 */
function updateCircuitBreakerMetric(serviceName, state) {
  const stateValue = state === 'CLOSED' ? 0 : state === 'OPEN' ? 1 : 2;
  circuitBreakerState.set({ service: serviceName }, stateValue);
}

/**
 * Record telemetry ingestion
 */
function recordTelemetryIngestion(serviceName, count = 1) {
  telemetryPointsIngested.labels(serviceName).inc(count);
}

/**
 * Record prediction generation
 */
function recordPredictionGenerated(serviceName, confidence) {
  predictionsGenerated.labels(serviceName).inc();
  if (confidence !== undefined) {
    predictionConfidence.observe(confidence);
  }
}

/**
 * Record database operation timing
 */
function recordDatabaseOperation(operation, model, duration, error = null) {
  databaseQueryDuration.labels(operation, model).observe(duration / 1000);
  if (error) {
    databaseErrorsTotal.labels(operation, model).inc();
  }
}

/**
 * Metrics endpoint handler
 */
function metricsHandler(req, res) {
  res.set('Content-Type', register.contentType);
  return register.metrics();
}

module.exports = {
  register,
  metricsMiddleware,
  metricsHandler,
  updateCircuitBreakerMetric,
  recordTelemetryIngestion,
  recordPredictionGenerated,
  recordDatabaseOperation,
  // Export metrics for direct access if needed
  metrics: {
    httpRequestDuration,
    httpRequestTotal,
    httpErrorsTotal,
    databaseQueryDuration,
    databaseErrorsTotal,
    telemetryPointsIngested,
    predictionsGenerated,
    predictionConfidence,
    circuitBreakerState,
  },
};
