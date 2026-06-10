const predictionModel = require('./prediction.model');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

/**
 * Prediction Business Logic Layer
 */
class PredictionService {
  /**
   * Get paginated predictions with filters.
   * @param {object} query
   * @returns {Promise<object>}
   */
  async getPredictions(query) {
    const {
      page = 1,
      limit = 20,
      service,
      serviceName,
      failure,
      startDate,
      endDate,
      minConfidence,
    } = query;

    return predictionModel.findAll({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      serviceName: service || serviceName,
      failure: failure !== undefined ? failure === 'true' || failure === true : undefined,
      startDate,
      endDate,
      minConfidence: minConfidence ? parseFloat(minConfidence) : undefined,
    });
  }

  /**
   * Get a single prediction by ID.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getPredictionById(id) {
    const prediction = await predictionModel.findById(id);

    if (!prediction) {
      throw ApiError.notFound(`Prediction '${id}' not found`);
    }

    return prediction;
  }

  /**
   * Get recent failure predictions.
   * @param {number} [limit=10]
   * @returns {Promise<object[]>}
   */
  async getRecentFailures(limit = 10) {
    return predictionModel.getRecentFailures(limit);
  }

  /**
   * Get top affected nodes by failure count.
   * @param {number} [limit=5]
   * @returns {Promise<object[]>}
   */
  async getTopAffectedNodes(limit = 5) {
    return predictionModel.getTopAffectedNodes(limit);
  }
}

module.exports = new PredictionService();
