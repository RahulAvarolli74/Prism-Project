const logger = require('../utils/logger');
const CONSTANTS = require('../config/constants');

/**
 * Preprocessing Layer
 * 
 * Cleans and prepares normalized telemetry data for feature extraction.
 * Handles outlier clamping, null filling, and metric normalization.
 */
class PreprocessingService {
  /**
   * Process normalized telemetry data.
   *
   * @param {object} normalizedData - Output from IngestionService.normalize()
   * @returns {object} Preprocessed data ready for feature extraction
   */
  static process(normalizedData) {
    const { metrics, logs, trace } = normalizedData;

    const processedMetrics = PreprocessingService._processMetrics(metrics);
    const processedLogs = PreprocessingService._processLogs(logs);
    const processedTrace = PreprocessingService._processTrace(trace);

    return {
      ...normalizedData,
      metrics: processedMetrics,
      logs: processedLogs,
      trace: processedTrace,
      preprocessedAt: new Date().toISOString(),
    };
  }

  /**
   * Process metrics: clamp outliers, fill nulls, normalize values.
   */
  static _processMetrics(metrics) {
    if (!metrics) return {};

    const processed = { ...metrics };

    // Clamp core metrics to valid ranges
    if (processed.cpu != null) {
      processed.cpu = PreprocessingService._clamp(processed.cpu, 0, 100);
    }

    if (processed.memory != null) {
      processed.memory = PreprocessingService._clamp(processed.memory, 0, 100);
    }

    if (processed.latency != null) {
      processed.latency = PreprocessingService._clamp(processed.latency, 0, CONSTANTS.FEATURE_VECTOR.LATENCY_MAX * 2);
    }

    if (processed.error_rate != null) {
      processed.error_rate = PreprocessingService._clamp(processed.error_rate, 0, 1);
    }

    // Add normalized versions (0-1 scale)
    processed.cpu_normalized = processed.cpu != null
      ? processed.cpu / CONSTANTS.FEATURE_VECTOR.CPU_MAX
      : 0;

    processed.memory_normalized = processed.memory != null
      ? processed.memory / CONSTANTS.FEATURE_VECTOR.MEMORY_MAX
      : 0;

    processed.latency_normalized = processed.latency != null
      ? Math.min(processed.latency / CONSTANTS.FEATURE_VECTOR.LATENCY_MAX, 1.0)
      : 0;

    return processed;
  }

  /**
   * Process logs: extract severity levels and sanitize.
   */
  static _processLogs(logs) {
    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      return {
        entries: [],
        counts: { critical: 0, error: 0, warning: 0, info: 0, unknown: 0 },
        totalCount: 0,
      };
    }

    const counts = { critical: 0, error: 0, warning: 0, info: 0, unknown: 0 };

    const entries = logs.map((log) => {
      const lowerLog = log.toLowerCase();
      let severity = 'unknown';

      if (CONSTANTS.LOG_SEVERITY.CRITICAL.some((kw) => lowerLog.includes(kw))) {
        severity = 'critical';
      } else if (CONSTANTS.LOG_SEVERITY.ERROR.some((kw) => lowerLog.includes(kw))) {
        severity = 'error';
      } else if (CONSTANTS.LOG_SEVERITY.WARNING.some((kw) => lowerLog.includes(kw))) {
        severity = 'warning';
      } else if (CONSTANTS.LOG_SEVERITY.INFO.some((kw) => lowerLog.includes(kw))) {
        severity = 'info';
      }

      counts[severity]++;

      return { message: log, severity };
    });

    return {
      entries,
      counts,
      totalCount: logs.length,
    };
  }

  /**
   * Process trace data: validate and enrich.
   */
  static _processTrace(trace) {
    if (!trace) {
      return { depth: 0, hasTrace: false };
    }

    return {
      ...trace,
      depth: trace.depth || 0,
      hasTrace: !!trace.trace_id,
    };
  }

  /**
   * Clamp a value between min and max bounds.
   */
  static _clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
}

module.exports = PreprocessingService;
