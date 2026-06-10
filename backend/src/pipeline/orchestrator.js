const IngestionService = require('./ingestion');
const PreprocessingService = require('./preprocessing');
const FeatureExtractor = require('./featureExtractor');
const mlServiceClient = require('../integrations/mlService');
const { getIO } = require('../integrations/websocket');
const alertService = require('../integrations/alertService');
const logger = require('../utils/logger');
const CONSTANTS = require('../config/constants');

/**
 * Pipeline Orchestrator
 * 
 * Coordinates the end-to-end telemetry processing pipeline:
 *   1. Ingestion (normalize raw data)
 *   2. Preprocessing (clean, clamp, normalize metrics)
 *   3. Feature Extraction (build feature vector)
 *   4. ML Prediction (call external service)
 *   5. Store Results
 *   6. Real-time Notifications (WebSocket + Alerts)
 */
class PipelineOrchestrator {
  /**
   * Run the full prediction pipeline for a telemetry payload.
   *
   * @param {object} rawPayload - Raw telemetry data from API
   * @param {object} deps - Injected dependencies
   * @param {object} deps.telemetryModel - Telemetry model for DB ops
   * @param {object} deps.predictionModel - Prediction model for DB ops
   * @param {object} deps.serviceModel - Service model for DB ops
   * @returns {object} Pipeline result with telemetry and prediction
   */
  static async run(rawPayload, deps) {
    const startTime = Date.now();

    try {
      // ── Step 1: Ingestion ──
      logger.debug('Pipeline: Starting ingestion');
      const normalizedData = IngestionService.normalize(rawPayload);

      // ── Step 2: Upsert Service ──
      const service = await deps.serviceModel.upsert(normalizedData.serviceName);

      // ── Step 3: Store Raw Telemetry ──
      const telemetryRecord = await deps.telemetryModel.create({
        serviceId: service.id,
        timestamp: normalizedData.timestamp,
        metrics: normalizedData.metrics,
        logs: normalizedData.logs,
        trace: normalizedData.trace,
        rawData: normalizedData.rawData,
      });

      // ── Step 4: Preprocessing ──
      logger.debug('Pipeline: Preprocessing telemetry');
      const preprocessedData = PreprocessingService.process(normalizedData);

      // ── Step 5: Feature Extraction ──
      logger.debug('Pipeline: Extracting features');
      const { features, featureMap, anomalies } = FeatureExtractor.extract(preprocessedData);

      // ── Step 6: ML Prediction ──
      let prediction = null;
      let mlResult = null;

      try {
        logger.debug('Pipeline: Calling ML service');
        mlResult = await mlServiceClient.predict(features);
      } catch (mlError) {
        logger.warn('Pipeline: ML service unavailable, using fallback', {
          error: mlError.message,
        });
        // Fallback: use local heuristic-based prediction
        mlResult = PipelineOrchestrator._fallbackPrediction(featureMap, anomalies, normalizedData.serviceName);
      }

      // ── Step 7: Store Prediction ──
      prediction = await deps.predictionModel.create({
        telemetryId: telemetryRecord.id,
        failure: mlResult.failure,
        confidence: mlResult.confidence,
        affectedNode: mlResult.affected_node || normalizedData.serviceName,
        rootCause: mlResult.root_cause || anomalies.join(' + '),
        features: { vector: features, map: featureMap },
        metadata: {
          anomalies,
          processingTimeMs: Date.now() - startTime,
          mlServiceUsed: !mlResult.isFallback,
        },
      });

      // ── Step 8: Emit Real-Time Events ──
      PipelineOrchestrator._emitEvents(service, telemetryRecord, prediction, featureMap, anomalies);

      // ── Step 9: Check for Alerts ──
      alertService.evaluate(prediction, service, anomalies);

      const processingTime = Date.now() - startTime;
      logger.info(`Pipeline: Completed in ${processingTime}ms`, {
        service: normalizedData.serviceName,
        failure: prediction.failure,
        confidence: prediction.confidence,
      });

      return {
        telemetry: telemetryRecord,
        prediction,
        insights: FeatureExtractor.generateInsights(featureMap, anomalies, normalizedData.serviceName),
        processingTimeMs: processingTime,
      };
    } catch (error) {
      logger.error('Pipeline: Processing failed', {
        error: error.message,
        payload: rawPayload?.service_name || rawPayload?.serviceName || 'unknown',
      });
      throw error;
    }
  }

  /**
   * Fallback prediction when ML service is unavailable.
   * Uses heuristic-based approach from extracted features.
   */
  static _fallbackPrediction(featureMap, anomalies, serviceName) {
    const riskScore =
      (featureMap.cpu_anomaly || 0) * 0.2 +
      (featureMap.memory_anomaly || 0) * 0.2 +
      (featureMap.latency_anomaly || 0) * 0.25 +
      (featureMap.error_spike || 0) * 0.25 +
      (featureMap.log_severity_score || 0) * 0.1;

    return {
      failure: riskScore > 0.5,
      confidence: Math.min(riskScore, 0.95),
      affected_node: serviceName,
      root_cause: anomalies.length > 0
        ? anomalies.join(' + ')
        : 'No anomalies detected',
      isFallback: true,
    };
  }

  /**
   * Emit WebSocket events for real-time frontend updates.
   */
  static _emitEvents(service, telemetry, prediction, featureMap, anomalies) {
    try {
      const io = getIO();
      if (!io) return;

      // Broadcast new telemetry to all connected clients
      io.emit(CONSTANTS.WS_EVENTS.NEW_TELEMETRY, {
        serviceId: service.id,
        serviceName: service.name,
        telemetryId: telemetry.id,
        timestamp: telemetry.timestamp,
        metrics: telemetry.metrics,
      });

      // Broadcast new prediction
      io.emit(CONSTANTS.WS_EVENTS.NEW_PREDICTION, {
        predictionId: prediction.id,
        serviceId: service.id,
        serviceName: service.name,
        failure: prediction.failure,
        confidence: prediction.confidence,
        affectedNode: prediction.affectedNode,
        rootCause: prediction.rootCause,
      });

      // Emit to service-specific room
      io.to(`service:${service.name}`).emit(CONSTANTS.WS_EVENTS.NEW_PREDICTION, {
        predictionId: prediction.id,
        failure: prediction.failure,
        confidence: prediction.confidence,
        affectedNode: prediction.affectedNode,
        rootCause: prediction.rootCause,
      });

      // Dashboard update
      io.emit(CONSTANTS.WS_EVENTS.DASHBOARD_UPDATE, {
        type: 'new_prediction',
        serviceName: service.name,
        failure: prediction.failure,
        confidence: prediction.confidence,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // WebSocket errors should never crash the pipeline
      logger.warn('Pipeline: Failed to emit WebSocket events', { error: error.message });
    }
  }
}

module.exports = PipelineOrchestrator;
