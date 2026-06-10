const { getIO } = require('./websocket');
const CONSTANTS = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Alert Service
 * 
 * Evaluates predictions and telemetry to generate alerts
 * when thresholds are exceeded. Emits alerts via WebSocket.
 */
class AlertService {
  /**
   * Evaluate a prediction and generate alerts if needed.
   *
   * @param {object} prediction - Stored prediction record
   * @param {object} service - Service record
   * @param {string[]} anomalies - Detected anomalies from feature extraction
   */
  evaluate(prediction, service, anomalies) {
    try {
      const alerts = [];

      // ── Critical Alert: High-confidence failure predicted ──
      if (prediction.failure && prediction.confidence >= 0.85) {
        alerts.push({
          level: CONSTANTS.ALERT_LEVELS.CRITICAL,
          title: `Critical Failure Predicted: ${service.name}`,
          message: `High confidence (${(prediction.confidence * 100).toFixed(1)}%) failure predicted for ${service.name}`,
          service: service.name,
          predictionId: prediction.id,
          confidence: prediction.confidence,
          rootCause: prediction.rootCause,
          anomalies,
          timestamp: new Date().toISOString(),
        });
      }

      // ── Warning Alert: Moderate-confidence failure ──
      else if (prediction.failure && prediction.confidence >= 0.6) {
        alerts.push({
          level: CONSTANTS.ALERT_LEVELS.WARNING,
          title: `Potential Failure: ${service.name}`,
          message: `Moderate confidence (${(prediction.confidence * 100).toFixed(1)}%) failure predicted for ${service.name}`,
          service: service.name,
          predictionId: prediction.id,
          confidence: prediction.confidence,
          rootCause: prediction.rootCause,
          anomalies,
          timestamp: new Date().toISOString(),
        });
      }

      // ── Info Alert: Multiple anomalies without failure prediction ──
      else if (!prediction.failure && anomalies.length >= 3) {
        alerts.push({
          level: CONSTANTS.ALERT_LEVELS.INFO,
          title: `Multiple Anomalies: ${service.name}`,
          message: `${anomalies.length} anomalies detected for ${service.name} but no failure predicted`,
          service: service.name,
          anomalies,
          timestamp: new Date().toISOString(),
        });
      }

      // ── Emit alerts via WebSocket ──
      if (alerts.length > 0) {
        this._emitAlerts(alerts, service.name);
      }
    } catch (error) {
      // Alert failures should never crash the system
      logger.error('AlertService: Evaluation failed', { error: error.message });
    }
  }

  /**
   * Emit alerts through WebSocket.
   */
  _emitAlerts(alerts, serviceName) {
    const io = getIO();
    if (!io) return;

    for (const alert of alerts) {
      // Broadcast to all clients
      io.emit(CONSTANTS.WS_EVENTS.SERVICE_ALERT, alert);

      // Also emit to service-specific room
      io.to(`service:${serviceName}`).emit(CONSTANTS.WS_EVENTS.SERVICE_ALERT, alert);

      logger.warn(`Alert [${alert.level.toUpperCase()}]: ${alert.title}`, {
        confidence: alert.confidence,
        service: serviceName,
      });
    }
  }
}

module.exports = new AlertService();
