const mlServiceClient = require('../../integrations/mlService');
const logger = require('../../utils/logger');

/**
 * ML Integration Layer
 *
 * Provides a higher-level interface for ML service interactions,
 * including health monitoring and prediction requests.
 */
class MLIntegration {
  /**
   * Request prediction from ML service.
   * @param {number[]} features - Feature vector
   * @returns {Promise<object>} Prediction result
   */
  async predict(features) {
    return mlServiceClient.predict(features);
  }

  /**
   * Check ML service health status.
   * @returns {Promise<object>}
   */
  async getHealth() {
    return mlServiceClient.healthCheck();
  }

  /**
   * Get circuit breaker status.
   * @returns {object}
   */
  getCircuitStatus() {
    return mlServiceClient.getCircuitState();
  }
}

module.exports = new MLIntegration();
