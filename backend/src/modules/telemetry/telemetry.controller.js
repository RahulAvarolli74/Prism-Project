const telemetryService = require('./telemetry.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const logger = require('../../utils/logger');
const CONSTANTS = require('../../config/constants');
const { buildTelemetryEventsFromOtlp } = require('./otel.mapper');

/**
 * Telemetry Controller
 * Handles HTTP request/response for telemetry endpoints.
 */
class TelemetryController {
  /**
   * POST /telemetry — Ingest telemetry data
   */
  ingest = asyncHandler(async (req, res) => {
    const result = await telemetryService.ingest(req.body);

    ApiResponse.created(
      {
        telemetry: {
          id: result.telemetry.id,
          serviceId: result.telemetry.serviceId,
          timestamp: result.telemetry.timestamp,
        },
        prediction: result.prediction
          ? {
              id: result.prediction.id,
              failure: result.prediction.failure,
              confidence: result.prediction.confidence,
              affectedNode: result.prediction.affectedNode,
              rootCause: result.prediction.rootCause,
            }
          : null,
        insights: result.insights,
        processingTimeMs: result.processingTimeMs,
      },
      CONSTANTS.MESSAGES.TELEMETRY_INGESTED
    ).send(res);
  });

  /**
   * POST /v1/traces|logs|metrics — Ingest OTLP JSON from OpenTelemetry Collector
   */
  ingestOtel = asyncHandler(async (req, res) => {
    const signalType = req.params.signalType;
    const events = buildTelemetryEventsFromOtlp(signalType, req.body);

    const results = [];

    for (const event of events) {
      const result = await telemetryService.ingest(event);
      results.push({
        telemetry: {
          id: result.telemetry.id,
          serviceId: result.telemetry.serviceId,
          timestamp: result.telemetry.timestamp,
        },
        prediction: result.prediction
          ? {
              id: result.prediction.id,
              failure: result.prediction.failure,
              confidence: result.prediction.confidence,
              affectedNode: result.prediction.affectedNode,
              rootCause: result.prediction.rootCause,
            }
          : null,
        insights: result.insights,
        processingTimeMs: result.processingTimeMs,
      });
    }

    ApiResponse.created(
      {
        signalType,
        received: Array.isArray(events) ? events.length : 0,
        processed: results.length,
        items: results,
      },
      `OTLP ${signalType} payload ingested successfully`
    ).send(res);
  });

  /**
   * GET /telemetry — List telemetry with pagination & filters
   */
  list = asyncHandler(async (req, res) => {
    const result = await telemetryService.getTelemetry(req.query);

    ApiResponse.paginated(
      result.data,
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      }
    ).send(res);
  });

  /**
   * GET /telemetry/:id — Get single telemetry record
   */
  getById = asyncHandler(async (req, res) => {
    const telemetry = await telemetryService.getTelemetryById(req.params.id);
    ApiResponse.success(telemetry).send(res);
  });
}

module.exports = new TelemetryController();
