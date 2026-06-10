/**
 * Application-wide constants.
 * Centralized to avoid magic numbers and strings scattered across the codebase.
 */

const CONSTANTS = {
  // ── Pagination ──
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  // ── Feature Extraction Thresholds ──
  THRESHOLDS: {
    CPU_WARNING: 70,
    CPU_CRITICAL: 90,
    MEMORY_WARNING: 75,
    MEMORY_CRITICAL: 95,
    LATENCY_WARNING: 200,   // ms
    LATENCY_CRITICAL: 500,  // ms
    ERROR_RATE_WARNING: 0.05,
    ERROR_RATE_CRITICAL: 0.15,
  },

  // ── ML Service ──
  ML_SERVICE: {
    PREDICT_ENDPOINT: '/predict',
    HEALTH_ENDPOINT: '/health',
    RETRY_DELAY_BASE: 1000,   // ms, for exponential backoff
    CIRCUIT_BREAKER: {
      FAILURE_THRESHOLD: 5,    // failures before opening circuit
      RESET_TIMEOUT: 30000,    // ms before trying again
    },
  },

  // ── Log Severity Keywords ──
  LOG_SEVERITY: {
    CRITICAL: ['fatal', 'critical', 'panic', 'crash', 'out of memory', 'oom'],
    ERROR: ['error', 'exception', 'fail', 'timeout', 'refused', 'exhausted'],
    WARNING: ['warn', 'warning', 'deprecated', 'slow', 'retry', 'degraded'],
    INFO: ['info', 'success', 'ok', 'healthy', 'processed', 'completed'],
  },

  // ── Feature Vector Config ──
  FEATURE_VECTOR: {
    // Order of features in the vector sent to ML model
    ORDER: [
      'cpu_normalized',
      'memory_normalized',
      'latency_normalized',
      'error_rate',
      'log_severity_score',
      'error_log_count',
      'dependency_depth',
      'cpu_anomaly',
      'memory_anomaly',
      'latency_anomaly',
      'error_spike',
    ],
    // Normalization bounds
    CPU_MAX: 100,
    MEMORY_MAX: 100,
    LATENCY_MAX: 1000,   // ms
  },

  // ── WebSocket Events ──
  WS_EVENTS: {
    NEW_TELEMETRY: 'new_telemetry',
    NEW_PREDICTION: 'new_prediction',
    SERVICE_ALERT: 'service_alert',
    DASHBOARD_UPDATE: 'dashboard_update',
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    SUBSCRIBE_SERVICE: 'subscribe_service',
    UNSUBSCRIBE_SERVICE: 'unsubscribe_service',
  },

  // ── Alert Levels ──
  ALERT_LEVELS: {
    INFO: 'info',
    WARNING: 'warning',
    CRITICAL: 'critical',
  },

  // ── HTTP Status Messages ──
  MESSAGES: {
    TELEMETRY_INGESTED: 'Telemetry data ingested successfully',
    PREDICTION_CREATED: 'Prediction generated successfully',
    SERVICE_NOT_FOUND: 'Service not found',
    ML_SERVICE_UNAVAILABLE: 'ML prediction service is currently unavailable',
    VALIDATION_ERROR: 'Validation failed',
    INTERNAL_ERROR: 'Internal server error',
    RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
  },
};

module.exports = CONSTANTS;
