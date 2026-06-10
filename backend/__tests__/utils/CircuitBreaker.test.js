/**
 * Unit Tests for CircuitBreaker
 * Tests state transitions, failure/success recording, and retry logic
 */

const CircuitBreaker = require('../../src/utils/CircuitBreaker');

describe('CircuitBreaker', () => {
  let breaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({
      name: 'TestService',
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
    });
  });

  describe('Initial State', () => {
    test('should start in CLOSED state', () => {
      expect(breaker.isClosed()).toBe(true);
      expect(breaker.isOpen()).toBe(false);
      expect(breaker.isHalfOpen()).toBe(false);
    });
  });

  describe('Failure Handling', () => {
    test('should remain CLOSED until failureThreshold is reached', () => {
      breaker.recordFailure();
      expect(breaker.isClosed()).toBe(true);

      breaker.recordFailure();
      expect(breaker.isClosed()).toBe(true);

      breaker.recordFailure();
      expect(breaker.isOpen()).toBe(true);
    });

    test('should transition to OPEN after failureThreshold', () => {
      for (let i = 0; i < 3; i++) {
        breaker.recordFailure();
      }
      expect(breaker.isOpen()).toBe(true);
    });
  });

  describe('Recovery', () => {
    test('should transition to HALF_OPEN after timeout', async () => {
      // Trigger OPEN
      for (let i = 0; i < 3; i++) {
        breaker.recordFailure();
      }
      expect(breaker.isOpen()).toBe(true);

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Should now allow attempt (transition to HALF_OPEN)
      expect(breaker.canAttempt()).toBe(true);
      expect(breaker.isHalfOpen()).toBe(true);
    });

    test('should return to CLOSED on success threshold', async () => {
      // Trigger OPEN
      for (let i = 0; i < 3; i++) {
        breaker.recordFailure();
      }

      // Wait and transition to HALF_OPEN
      await new Promise((resolve) => setTimeout(resolve, 1100));
      breaker.canAttempt();

      // Record successes
      breaker.recordSuccess();
      expect(breaker.isHalfOpen()).toBe(true);

      breaker.recordSuccess();
      expect(breaker.isClosed()).toBe(true);
    });
  });

  describe('canAttempt', () => {
    test('should allow attempts in CLOSED state', () => {
      expect(breaker.canAttempt()).toBe(true);
    });

    test('should reject attempts in OPEN state before timeout', () => {
      for (let i = 0; i < 3; i++) {
        breaker.recordFailure();
      }
      expect(breaker.canAttempt()).toBe(false);
    });

    test('should allow attempts in HALF_OPEN state', async () => {
      for (let i = 0; i < 3; i++) {
        breaker.recordFailure();
      }
      await new Promise((resolve) => setTimeout(resolve, 1100));
      expect(breaker.canAttempt()).toBe(true);
    });
  });

  describe('getStatus', () => {
    test('should return accurate status information', () => {
      breaker.recordFailure();
      const status = breaker.getStatus();

      expect(status.name).toBe('TestService');
      expect(status.state).toBe('CLOSED');
      expect(status.failureCount).toBe(1);
      expect(status.successCount).toBe(0);
    });
  });

  describe('onStateChange callback', () => {
    test('should call onStateChange when state transitions', () => {
      const callback = jest.fn();
      const testBreaker = new CircuitBreaker({
        name: 'CallbackTest',
        failureThreshold: 2,
        onStateChange: callback,
      });

      testBreaker.recordFailure();
      expect(callback).not.toHaveBeenCalled();

      testBreaker.recordFailure();
      expect(callback).toHaveBeenCalledWith('CallbackTest', 'OPEN');
    });
  });
});
