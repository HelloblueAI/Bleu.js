import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

class AdvancedCircuitBreaker extends EventEmitter {
  static States = {
    CLOSED: 'CLOSED',
    OPEN: 'OPEN',
    HALF_OPEN: 'HALF_OPEN',
  };

  constructor(options = {}) {
    super();
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      successThreshold: options.successThreshold || 3,
      timeout: options.timeout || 10000,
      resetTimeout: options.resetTimeout || 60000,
      monitorInterval: options.monitorInterval || 5000,
      volumeThreshold: options.volumeThreshold || 0,
      errorPercentageThreshold: options.errorPercentageThreshold || 50,
      bulkhead: options.bulkhead || 10,
      cache: options.cache !== false,
      cacheTTL: options.cacheTTL || 300,
      ...options,
    };

    this.state = AdvancedCircuitBreaker.States.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.lastStateChange = Date.now();
    this.executionTimes = [];
    this.activeRequests = 0;
    this.cache = new Map();
    this.statistics = this.initializeStatistics();

    this.startMonitoring();
  }

  initializeStatistics() {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      timeouts: 0,
      rejectedRequests: 0,
      cachedResponses: 0,
      averageResponseTime: 0,
      concurrentRequests: 0,
      maxConcurrentRequests: 0,
      lastError: null,
      stateTransitions: [],
      responseTimePercentiles: new Map(),
      errorPercentage: 0,
      throughput: 0,
      lastCalculated: Date.now(),
      lastTotalRequests: 0,
    };
  }

  startMonitoring() {
    this.monitorInterval = setInterval(() => {
      this.updateStatistics();
      this.emit('statistics', this.getStatistics());
    }, this.options.monitorInterval);
  }

  updateStatistics() {
    const now = Date.now();
    const timeWindow = (now - this.statistics.lastCalculated) / 1000;

    this.statistics.throughput =
      (this.statistics.totalRequests - this.statistics.lastTotalRequests) /
      timeWindow;

    if (this.statistics.totalRequests > 0) {
      this.statistics.errorPercentage =
        (this.statistics.failedRequests / this.statistics.totalRequests) * 100;
    }

    if (this.executionTimes.length > 0) {
      const sorted = [...this.executionTimes].sort((a, b) => a - b);
      [50, 75, 90, 95, 99].forEach((p) => {
        const index = Math.floor((p / 100) * sorted.length);
        this.statistics.responseTimePercentiles.set(p, sorted[index]);
      });
    }

    const cutoff = now - this.options.resetTimeout;
    this.executionTimes = this.executionTimes.filter((time) => time > cutoff);

    this.statistics.lastCalculated = now;
    this.statistics.lastTotalRequests = this.statistics.totalRequests;
  }

  async execute(fn, cacheKey = null) {
    this.statistics.totalRequests++;
    this.statistics.concurrentRequests = ++this.activeRequests;
    this.statistics.maxConcurrentRequests = Math.max(
      this.statistics.maxConcurrentRequests,
      this.statistics.concurrentRequests,
    );

    try {
      if (this.activeRequests > this.options.bulkhead) {
        this.statistics.rejectedRequests++;
        throw new Error('Circuit breaker bulkhead limit exceeded');
      }

      if (this.options.cache && cacheKey) {
        const cached = this.cache.get(cacheKey);
        if (cached && cached.expires > Date.now()) {
          this.statistics.cachedResponses++;
          return cached.value;
        }
      }

      if (this._isOpen()) {
        if (this._shouldAttemptReset()) {
          this._transitionState(AdvancedCircuitBreaker.States.HALF_OPEN);
        } else {
          throw new Error(`Circuit breaker is ${this.state}`);
        }
      }

      const startTime = performance.now();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => {
          this.statistics.timeouts++;
          reject(new Error('Operation timeout'));
        }, this.options.timeout),
      );

      const result = await Promise.race([fn(), timeoutPromise]);
      const duration = performance.now() - startTime;

      this._onSuccess(duration);

      if (this.options.cache && cacheKey) {
        this.cache.set(cacheKey, {
          value: result,
          expires: Date.now() + this.options.cacheTTL * 1000,
        });
      }

      return result;
    } catch (error) {
      this._onFailure(error);
      throw error;
    } finally {
      this.statistics.concurrentRequests = --this.activeRequests;
    }
  }

  _isOpen() {
    return this.state === AdvancedCircuitBreaker.States.OPEN;
  }

  _shouldAttemptReset() {
    return Date.now() - this.lastFailureTime >= this.options.resetTimeout;
  }

  _transitionState(newState) {
    if (this.state === newState) return;

    const transition = {
      from: this.state,
      to: newState,
      timestamp: Date.now(),
      metrics: { ...this.statistics },
    };

    this.statistics.stateTransitions.push(transition);
    if (this.statistics.stateTransitions.length > 100) {
      this.statistics.stateTransitions.shift();
    }

    this.state = newState;
    this.lastStateChange = Date.now();
    this.emit('stateChange', transition);
  }

  _onSuccess(duration) {
    this.statistics.successfulRequests++;
    this.failures = 0;
    this.executionTimes.push(duration);

    if (this.executionTimes.length > 100) {
      this.executionTimes.shift();
    }

    if (this.state === AdvancedCircuitBreaker.States.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.options.successThreshold) {
        this._transitionState(AdvancedCircuitBreaker.States.CLOSED);
        this.successes = 0;
      }
    }
  }

  _onFailure(error) {
    this.statistics.failedRequests++;
    this.statistics.lastError = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
    };

    this.failures++;
    this.lastFailureTime = Date.now();
    this.successes = 0;

    if (
      this.failures >= this.options.failureThreshold ||
      this.statistics.errorPercentage >= this.options.errorPercentageThreshold
    ) {
      this._transitionState(AdvancedCircuitBreaker.States.OPEN);
    }
  }

  getStatistics() {
    return {
      ...this.statistics,
      currentState: this.state,
      failureCount: this.failures,
      successCount: this.successes,
      lastStateChange: this.lastStateChange,
      uptime: Date.now() - this.lastStateChange,
      responseTimePercentiles: Object.fromEntries(
        this.statistics.responseTimePercentiles,
      ),
    };
  }

  reset() {
    this.state = AdvancedCircuitBreaker.States.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.lastStateChange = Date.now();
    this.executionTimes = [];
    this.activeRequests = 0;
    this.cache.clear();
    this.statistics = this.initializeStatistics();
    this.emit('reset');
  }

  destroy() {
    clearInterval(this.monitorInterval);
    this.removeAllListeners();
    this.cache.clear();
  }
}

export default AdvancedCircuitBreaker;
