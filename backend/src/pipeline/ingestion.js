const logger = require('../utils/logger');

/**
 * Ingestion Layer
 * 
 * Validates, normalizes, and sanitizes raw telemetry data.
 * Handles missing/extra fields gracefully — never rejects valid-enough data.
 */
class IngestionService {
  /**
   * Normalize raw telemetry payload into a consistent internal format.
   *
   * @param {object} rawPayload - Raw telemetry from the API
   * @returns {object} Normalized telemetry data
   */
  static normalize(rawPayload) {
    const {
      service_name,
      serviceName,
      timestamp,
      metrics = {},
      logs = [],
      trace = {},
      ...extraFields
    } = rawPayload;

    // Support both snake_case and camelCase for service name
    const resolvedServiceName = service_name || serviceName;

    if (!resolvedServiceName) {
      throw new Error('Service name is required (service_name or serviceName)');
    }

    // ── Normalize Timestamp ──
    const normalizedTimestamp = IngestionService._normalizeTimestamp(timestamp);

    // ── Normalize Metrics ──
    const normalizedMetrics = IngestionService._normalizeMetrics(metrics);

    // ── Normalize Logs ──
    const normalizedLogs = IngestionService._normalizeLogs(logs);

    // ── Normalize Trace ──
    const normalizedTrace = IngestionService._normalizeTrace(trace);

    const result = {
      serviceName: resolvedServiceName.toLowerCase().trim(),
      timestamp: normalizedTimestamp,
      metrics: normalizedMetrics,
      logs: normalizedLogs,
      trace: normalizedTrace,
      rawData: rawPayload, // Preserve original for audit trail
    };

    // Capture any extra/unexpected fields in metadata
    if (Object.keys(extraFields).length > 0) {
      result.extraFields = extraFields;
      logger.debug(`Ingestion: extra fields received for ${resolvedServiceName}:`, Object.keys(extraFields));
    }

    return result;
  }

  /**
   * Normalize timestamp to a valid Date object.
   * Falls back to current time if invalid/missing.
   */
  static _normalizeTimestamp(timestamp) {
    if (!timestamp) {
      logger.warn('Ingestion: No timestamp provided, using current time');
      return new Date();
    }

    const parsed = new Date(timestamp);
    if (isNaN(parsed.getTime())) {
      logger.warn(`Ingestion: Invalid timestamp "${timestamp}", using current time`);
      return new Date();
    }

    return parsed;
  }

  /**
   * Normalize metrics — ensure numeric values, apply defaults.
   */
  static _normalizeMetrics(metrics) {
    const normalized = {};

    // Core metrics with defaults
    normalized.cpu = IngestionService._toNumber(metrics.cpu, null);
    normalized.memory = IngestionService._toNumber(metrics.memory, null);
    normalized.latency = IngestionService._toNumber(metrics.latency, null);
    normalized.error_rate = IngestionService._toNumber(metrics.error_rate ?? metrics.errorRate, null);

    // Preserve any additional custom metrics
    const coreKeys = ['cpu', 'memory', 'latency', 'error_rate', 'errorRate'];
    for (const [key, value] of Object.entries(metrics)) {
      if (!coreKeys.includes(key)) {
        normalized[key] = value;
      }
    }

    return normalized;
  }

  /**
   * Normalize logs — ensure array of strings.
   */
  static _normalizeLogs(logs) {
    if (!logs) return [];

    if (typeof logs === 'string') {
      return [logs];
    }

    if (Array.isArray(logs)) {
      return logs
        .filter((log) => log != null)
        .map((log) => (typeof log === 'string' ? log : JSON.stringify(log)));
    }

    return [JSON.stringify(logs)];
  }

  /**
   * Normalize trace data.
   */
  static _normalizeTrace(trace) {
    if (!trace || typeof trace !== 'object') {
      return null;
    }

    return {
      trace_id: trace.trace_id || trace.traceId || null,
      parent_service: trace.parent_service || trace.parentService || null,
      depth: IngestionService._toNumber(trace.depth, 0),
      ...Object.fromEntries(
        Object.entries(trace).filter(
          ([key]) => !['trace_id', 'traceId', 'parent_service', 'parentService', 'depth'].includes(key)
        )
      ),
    };
  }

  /**
   * Safely convert a value to a number.
   */
  static _toNumber(value, defaultValue) {
    if (value == null) return defaultValue;
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  }
}

module.exports = IngestionService;
