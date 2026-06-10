const axios = require('axios');
const env = require('../config/env');
const CONSTANTS = require('../config/constants');
const logger = require('../utils/logger');

/**
 * ML Service Client
 * 
 * Handles communication with the external Python FastAPI ML prediction service.
 * Features:
 *   - Configurable endpoint and timeout
 *   - Retry mechanism with exponential backoff
 *   - Circuit breaker pattern for graceful degradation
 *   - Health check capability
 */
class MLServiceClient {
  constructor() {
    this.baseUrl = env.mlService.url;
    this.timeout = env.mlService.timeout;
    this.maxRetries = env.mlService.retries;

    // Circuit breaker state
    this._circuitState = 'CLOSED'; // CLOSED | OPEN | HALF_OPEN
    this._failureCount = 0;
    this._lastFailureTime = null;
    this._circuitConfig = CONSTANTS.ML_SERVICE.CIRCUIT_BREAKER;

    // Axios instance with defaults
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Request/Response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`ML Service Request: ${config.method?.toUpperCase()} ${config.url}`);
        config.metadata = { startTime: Date.now() };
        return config;
      },
      (error) => {
        logger.error('ML Service Request Error:', error.message);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - response.config.metadata.startTime;
        logger.debug(`ML Service Response: ${response.status} (${duration}ms)`);
        return response;
      },
      (error) => {
        const duration = error.config?.metadata
          ? Date.now() - error.config.metadata.startTime
          : 0;
        logger.error(`ML Service Error: ${error.message} (${duration}ms)`);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Send feature vector to ML service for prediction.
   *
   * @param {number[]} features - Feature vector
   * @returns {Promise<object>} Prediction result
   * @throws {Error} If ML service is unavailable after retries
   */
  async predict(features) {
    // Check circuit breaker
    if (!this._isCircuitAllowed()) {
      throw new Error('ML Service circuit breaker is OPEN — service unavailable');
    }

    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.post(CONSTANTS.ML_SERVICE.PREDICT_ENDPOINT, {
          features,
        });

        // Reset circuit breaker on success
        this._onSuccess();

        return response.data;
      } catch (error) {
        lastError = error;
        logger.warn(`ML Service: Attempt ${attempt}/${this.maxRetries} failed`, {
          error: error.message,
          code: error.code,
        });

        if (attempt < this.maxRetries) {
          const delay = CONSTANTS.ML_SERVICE.RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
          logger.debug(`ML Service: Retrying in ${delay}ms...`);
          await this._sleep(delay);
        }
      }
    }

    // All retries exhausted
    this._onFailure();
    throw new Error(`ML Service unavailable after ${this.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Check ML service health.
   * @returns {Promise<object>} Health status
   */
  async healthCheck() {
    try {
      const response = await this.client.get(CONSTANTS.ML_SERVICE.HEALTH_ENDPOINT, {
        timeout: 5000,
      });
      this._onSuccess();
      return { status: 'healthy', data: response.data };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        circuitState: this._circuitState,
      };
    }
  }

  /**
   * Get current circuit breaker state.
   */
  getCircuitState() {
    return {
      state: this._circuitState,
      failureCount: this._failureCount,
      lastFailureTime: this._lastFailureTime,
    };
  }

  // ── Circuit Breaker Logic ──

  _isCircuitAllowed() {
    if (this._circuitState === 'CLOSED') return true;

    if (this._circuitState === 'OPEN') {
      const elapsed = Date.now() - this._lastFailureTime;
      if (elapsed >= this._circuitConfig.RESET_TIMEOUT) {
        logger.info('ML Service: Circuit breaker transitioning to HALF_OPEN');
        this._circuitState = 'HALF_OPEN';
        return true;
      }
      return false;
    }

    // HALF_OPEN — allow one attempt
    return true;
  }

  _onSuccess() {
    if (this._circuitState !== 'CLOSED') {
      logger.info('ML Service: Circuit breaker CLOSED (recovered)');
    }
    this._circuitState = 'CLOSED';
    this._failureCount = 0;
  }

  _onFailure() {
    this._failureCount++;
    this._lastFailureTime = Date.now();

    if (this._failureCount >= this._circuitConfig.FAILURE_THRESHOLD) {
      this._circuitState = 'OPEN';
      logger.error(`ML Service: Circuit breaker OPEN after ${this._failureCount} failures`);
    }
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
module.exports = new MLServiceClient();
