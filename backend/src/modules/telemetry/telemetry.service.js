const PipelineOrchestrator = require('../../pipeline/orchestrator');
const telemetryModel = require('./telemetry.model');
const predictionModel = require('../prediction/prediction.model');
const serviceModel = require('../service/service.model');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

/**
 * Telemetry Business Logic Layer
 */
class TelemetryService {
  /**
   * Ingest telemetry data — runs the full pipeline.
   *
   * @param {object} rawPayload - Raw telemetry from the API
   * @returns {Promise<object>} Pipeline result
   */
  async ingest(rawPayload) {
    const result = await PipelineOrchestrator.run(rawPayload, {
      telemetryModel,
      predictionModel,
      serviceModel,
    });

    return result;
  }

  /**
   * Get paginated telemetry records.
   * @param {object} query - Filter/pagination params
   * @returns {Promise<object>}
   */
  async getTelemetry(query) {
    const {
      page = 1,
      limit = 20,
      service,
      serviceName,
      startDate,
      endDate,
    } = query;

    return telemetryModel.findAll({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      serviceId: service,
      serviceName,
      startDate,
      endDate,
    });
  }

  /**
   * Get a single telemetry record by ID.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getTelemetryById(id) {
    const telemetry = await telemetryModel.findById(id);

    if (!telemetry) {
      throw ApiError.notFound(`Telemetry record '${id}' not found`);
    }

    return telemetry;
  }
}

module.exports = new TelemetryService();
