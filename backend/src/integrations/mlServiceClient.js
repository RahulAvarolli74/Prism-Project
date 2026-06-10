const axios = require('axios');
const CircuitBreaker = require('./CircuitBreaker');
const logger = require('./logger');

/**
 * ML Service Integration with Circuit Breaker + Retry Logic
 * Provides resilience and graceful degradation for ML model inference
 */

const mlServiceBreaker = new CircuitBreaker({
  name: 'MLService',
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 30000,
  onStateChange: (name, state) => {
    logger.warn(`⚠️ Circuit Breaker State Change: ${name} → ${state}`);
  },
});

/**
 * Exponential backoff retry strategy
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Initial delay in ms
 * @returns {Promise}
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 100) {
  let lastError;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (i < maxRetries) {
        const delay = baseDelay * Math.pow(2, i) + Math.random() * 100;
        logger.debug(`Retry attempt ${i + 1}/${maxRetries} after ${Math.round(delay)}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Call ML service with circuit breaker protection
 * @param {Object} payload - Prediction request payload
 * @param {string} endpoint - ML service endpoint
 * @returns {Promise<Object|null>} Prediction result or null if circuit open
 */
async function callMLService(payload, endpoint = '/predict') {
  if (!mlServiceBreaker.canAttempt()) {
    const status = mlServiceBreaker.getStatus();
    logger.warn('ML Service circuit breaker is OPEN', status);
    return null;
  }

  try {
    const result = await retryWithBackoff(async () => {
      const response = await axios.post(
        `${process.env.ML_SERVICE_URL}${endpoint}`,
        payload,
        {
          timeout: parseInt(process.env.ML_SERVICE_TIMEOUT) || 10000,
          headers: {
            'Content-Type': 'application/json',
            'x-service': 'prism-backend',
          },
        }
      );

      return response.data;
    }, 2);

    mlServiceBreaker.recordSuccess();
    logger.info('ML Service call succeeded', { endpoint });
    return result;
  } catch (error) {
    mlServiceBreaker.recordFailure();

    logger.error('ML Service call failed', {
      endpoint,
      error: error.message,
      code: error.code,
      status: error.response?.status,
    });

    return null;
  }
}

/**
 * Get circuit breaker status for monitoring
 */
function getMLServiceStatus() {
  return mlServiceBreaker.getStatus();
}

module.exports = {
  callMLService,
  getMLServiceStatus,
  retryWithBackoff,
};
