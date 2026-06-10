/**
 * Simple Circuit Breaker Pattern Implementation
 * Prevents cascading failures when external services become unreliable
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is failing, requests are rejected immediately
 * - HALF_OPEN: Testing if service recovered, limited requests allowed
 */

const CircuitBreakerState = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN',
};

class CircuitBreaker {
  constructor({
    name = 'Service',
    failureThreshold = 5,
    successThreshold = 2,
    timeout = 60000,
    onStateChange = null,
  } = {}) {
    this.name = name;
    this.failureThreshold = failureThreshold;
    this.successThreshold = successThreshold;
    this.timeout = timeout;
    this.onStateChange = onStateChange;

    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttemptTime = Date.now();
  }

  isOpen() {
    return this.state === CircuitBreakerState.OPEN;
  }

  isClosed() {
    return this.state === CircuitBreakerState.CLOSED;
  }

  isHalfOpen() {
    return this.state === CircuitBreakerState.HALF_OPEN;
  }

  setState(newState) {
    if (this.state !== newState) {
      this.state = newState;
      this.onStateChange?.(this.name, newState);
    }
  }

  recordSuccess() {
    this.failureCount = 0;

    if (this.isHalfOpen()) {
      this.successCount += 1;
      if (this.successCount >= this.successThreshold) {
        this.setState(CircuitBreakerState.CLOSED);
        this.successCount = 0;
      }
    }
  }

  recordFailure() {
    this.failureCount += 1;

    if (this.isClosed() && this.failureCount >= this.failureThreshold) {
      this.setState(CircuitBreakerState.OPEN);
      this.nextAttemptTime = Date.now() + this.timeout;
    }
  }

  canAttempt() {
    if (this.isClosed()) return true;
    if (this.isHalfOpen()) return true;

    // Open: check if we can transition to half-open
    if (this.isOpen() && Date.now() >= this.nextAttemptTime) {
      this.setState(CircuitBreakerState.HALF_OPEN);
      this.successCount = 0;
      return true;
    }

    return false;
  }

  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttemptTime: this.isOpen() ? this.nextAttemptTime : null,
    };
  }
}

module.exports = CircuitBreaker;
