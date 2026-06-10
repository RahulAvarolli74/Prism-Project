const CONSTANTS = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Feature Extractor
 * 
 * Converts preprocessed telemetry data into a numeric feature vector
 * suitable for the ML prediction model.
 */
class FeatureExtractor {
  /**
   * Extract feature vector from preprocessed telemetry.
   *
   * @param {object} preprocessedData - Output from PreprocessingService.process()
   * @returns {object} Feature extraction result
   *   - features: number[] — ordered feature vector for ML model
   *   - featureMap: object — named features for debugging/logging
   *   - anomalies: string[] — detected anomaly descriptions
   */
  static extract(preprocessedData) {
    const { metrics, logs, trace } = preprocessedData;

    const featureMap = {};
    const anomalies = [];

    // ── 1. CPU Utilization (normalized) ──
    featureMap.cpu_normalized = metrics.cpu_normalized || 0;
    if (metrics.cpu != null && metrics.cpu >= CONSTANTS.THRESHOLDS.CPU_CRITICAL) {
      anomalies.push(`CPU critical: ${metrics.cpu}%`);
      featureMap.cpu_anomaly = 1;
    } else if (metrics.cpu != null && metrics.cpu >= CONSTANTS.THRESHOLDS.CPU_WARNING) {
      featureMap.cpu_anomaly = 0.5;
    } else {
      featureMap.cpu_anomaly = 0;
    }

    // ── 2. Memory Utilization (normalized) ──
    featureMap.memory_normalized = metrics.memory_normalized || 0;
    if (metrics.memory != null && metrics.memory >= CONSTANTS.THRESHOLDS.MEMORY_CRITICAL) {
      anomalies.push(`Memory critical: ${metrics.memory}%`);
      featureMap.memory_anomaly = 1;
    } else if (metrics.memory != null && metrics.memory >= CONSTANTS.THRESHOLDS.MEMORY_WARNING) {
      featureMap.memory_anomaly = 0.5;
    } else {
      featureMap.memory_anomaly = 0;
    }

    // ── 3. Latency (normalized) ──
    featureMap.latency_normalized = metrics.latency_normalized || 0;
    if (metrics.latency != null && metrics.latency >= CONSTANTS.THRESHOLDS.LATENCY_CRITICAL) {
      anomalies.push(`Latency critical: ${metrics.latency}ms`);
      featureMap.latency_anomaly = 1;
    } else if (metrics.latency != null && metrics.latency >= CONSTANTS.THRESHOLDS.LATENCY_WARNING) {
      featureMap.latency_anomaly = 0.5;
    } else {
      featureMap.latency_anomaly = 0;
    }

    // ── 4. Error Rate ──
    featureMap.error_rate = metrics.error_rate || 0;
    if (metrics.error_rate != null && metrics.error_rate >= CONSTANTS.THRESHOLDS.ERROR_RATE_CRITICAL) {
      anomalies.push(`Error rate spike: ${(metrics.error_rate * 100).toFixed(1)}%`);
      featureMap.error_spike = 1;
    } else if (metrics.error_rate != null && metrics.error_rate >= CONSTANTS.THRESHOLDS.ERROR_RATE_WARNING) {
      featureMap.error_spike = 0.5;
    } else {
      featureMap.error_spike = 0;
    }

    // ── 5. Log Severity Score ──
    featureMap.log_severity_score = FeatureExtractor._calculateLogSeverityScore(logs);

    // ── 6. Error Log Count ──
    featureMap.error_log_count = logs?.counts
      ? (logs.counts.critical + logs.counts.error) / Math.max(logs.totalCount, 1)
      : 0;

    // ── 7. Dependency Depth ──
    featureMap.dependency_depth = trace?.depth
      ? Math.min(trace.depth / 10, 1.0)  // Normalize depth (max 10 assumed)
      : 0;

    // ── Build ordered feature vector ──
    const features = CONSTANTS.FEATURE_VECTOR.ORDER.map((key) => {
      const value = featureMap[key];
      if (value == null) {
        logger.warn(`Feature "${key}" is missing from feature map, defaulting to 0`);
        return 0;
      }
      return value;
    });

    logger.debug('Feature extraction complete', {
      serviceName: preprocessedData.serviceName,
      featureCount: features.length,
      anomalyCount: anomalies.length,
    });

    return {
      features,
      featureMap,
      anomalies,
    };
  }

  /**
   * Calculate a severity score from log analysis (0-1 scale).
   * Higher score = more severe logs.
   */
  static _calculateLogSeverityScore(logs) {
    if (!logs?.counts || logs.totalCount === 0) return 0;

    const { critical, error, warning, info } = logs.counts;
    const total = logs.totalCount;

    // Weighted scoring: critical=1.0, error=0.7, warning=0.3, info=0.05
    const weightedSum =
      critical * 1.0 +
      error * 0.7 +
      warning * 0.3 +
      info * 0.05;

    // Normalize to 0-1 range (max possible = total * 1.0)
    return Math.min(weightedSum / total, 1.0);
  }

  /**
   * Generate a human-readable summary of the contributing factors.
   */
  static generateInsights(featureMap, anomalies, serviceName) {
    const factors = [];

    if (featureMap.cpu_anomaly > 0) factors.push('high CPU utilization');
    if (featureMap.memory_anomaly > 0) factors.push('elevated memory usage');
    if (featureMap.latency_anomaly > 0) factors.push('high latency detected');
    if (featureMap.error_spike > 0) factors.push('error rate spike');
    if (featureMap.log_severity_score > 0.5) factors.push('severe log entries');
    if (featureMap.dependency_depth > 0.5) factors.push('deep dependency chain');

    return {
      service: serviceName,
      factors,
      anomalies,
      riskLevel: FeatureExtractor._assessRiskLevel(featureMap),
    };
  }

  /**
   * Assess overall risk level from features.
   */
  static _assessRiskLevel(featureMap) {
    const criticalCount = [
      featureMap.cpu_anomaly === 1,
      featureMap.memory_anomaly === 1,
      featureMap.latency_anomaly === 1,
      featureMap.error_spike === 1,
    ].filter(Boolean).length;

    if (criticalCount >= 2) return 'critical';
    if (criticalCount >= 1) return 'high';

    const warningCount = [
      featureMap.cpu_anomaly >= 0.5,
      featureMap.memory_anomaly >= 0.5,
      featureMap.latency_anomaly >= 0.5,
      featureMap.error_spike >= 0.5,
    ].filter(Boolean).length;

    if (warningCount >= 2) return 'medium';
    if (warningCount >= 1) return 'low';

    return 'healthy';
  }
}

module.exports = FeatureExtractor;
