//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.


import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import metrics from '../core/metrics.mjs';

export class AdvancedCircuitBreaker extends EventEmitter {
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
      volumeThreshold: options.volumeThreshold || 10,
      errorPercentageThreshold: options.errorPercentageThreshold || 50,
      bulkhead: options.bulkhead || 10,
      maxExecutionTime: options.maxExecutionTime || 5000,
      cache: options.cache !== false,
      cacheTTL: options.cacheTTL || 300,
      dynamicBulkhead: options.dynamicBulkhead !== false,
      adaptiveThreshold: options.adaptiveThreshold !== false,
      retry: {
        enabled: options.retry?.enabled ?? true,
        maxAttempts: options.retry?.maxAttempts || 3,
        backoff: options.retry?.backoff || 'exponential',
        initialDelay: options.retry?.initialDelay || 1000,
      },
      metrics: {
        enabled: options.metrics?.enabled ?? true,
        detailedErrors: options.metrics?.detailedErrors ?? true,
        historySize: options.metrics?.historySize || 1000,
      },
      healthCheck: {
        enabled: options.healthCheck?.enabled ?? true,
        interval: options.healthCheck?.interval || 30000,
        timeout: options.healthCheck?.timeout || 5000,
      },
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
    this.requestHistory = new Map();

    this.initializeStatistics();
    this.startMonitoring();
    if (this.options.healthCheck.enabled) {
      this.startHealthCheck();
    }
  }

  initializeStatistics() {
    this.statistics = {
      totalRequests: 0,
      failedRequests: 0,
      successfulRequests: 0,
      currentFailures: 0,
    };
  }

  async execute(fn, context = {}) {
    const { cacheKey = null, requestId = null, timeout = this.options.maxExecutionTime, retryAttempts = this.options.retry.maxAttempts } = context;

    metrics.incrementCounter('requests_total');
    const startTime = performance.now();
    this.activeRequests++;

    try {
      await this.checkCircuitState();

      if (this.activeRequests > this.options.bulkhead) {
        throw new Error('⚠️ Circuit breaker bulkhead limit exceeded');
      }

      if (cacheKey) {
        const cached = await this.checkCache(cacheKey);
        if (cached) return cached;
      }

      const result = await this.executeWithRetry(fn, { timeout, retryAttempts, requestId });

      await this.handleSuccess({ duration: performance.now() - startTime, result, cacheKey });

      return result;
    } catch (error) {
      await this.handleFailure({ error, startTime, requestId });
      throw this.enhanceError(error);
    } finally {
      this.activeRequests--;
      this.updateMetrics();
    }
  }

  async executeWithRetry(fn, { timeout, retryAttempts, requestId }) {
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        return await Promise.race([fn(), this.createTimeout(timeout)]);
      } catch (error) {
        if (attempt === retryAttempts) throw error;
        await this.sleep(this.calculateBackoff(attempt));
      }
    }
  }

  calculateBackoff(attempt) {
    const { backoff, initialDelay } = this.options.retry;
    switch (backoff) {
      case 'exponential': return initialDelay * Math.pow(2, attempt - 1);
      case 'linear': return initialDelay * attempt;
      case 'jitter': return initialDelay + Math.random() * initialDelay;
      default: return initialDelay;
    }
  }

  async checkCircuitState() {
    if (this.state === AdvancedCircuitBreaker.States.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionState(AdvancedCircuitBreaker.States.HALF_OPEN);
      } else {
        throw new Error(`⛔ Circuit breaker is ${this.state}`);
      }
    }
  }

  async checkCache(key) {
    if (!this.options.cache) return null;

    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      metrics.incrementCounter('cache_hits');
      return cached.value;
    }
    metrics.incrementCounter('cache_misses');
    return null;
  }

  async handleSuccess({ duration, result, cacheKey }) {
    this.failures = 0;
    this.recordExecutionTime(duration);

    if (this.state === AdvancedCircuitBreaker.States.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.options.successThreshold) {
        this.transitionState(AdvancedCircuitBreaker.States.CLOSED);
      }
    }

    if (cacheKey) {
      this.cache.set(cacheKey, { value: result, expires: Date.now() + this.options.cacheTTL * 1000 });
    }

    metrics.trackSuccess(duration);
  }

  async handleFailure({ error, startTime, requestId }) {
    this.failures++;
    this.lastFailureTime = Date.now();
    this.successes = 0;

    if (this.shouldOpen()) {
      this.transitionState(AdvancedCircuitBreaker.States.OPEN);
    }

    if (requestId) {
      this.requestHistory.set(requestId, { error, timestamp: Date.now() });
    }

    metrics.trackFailure(startTime);
  }

  shouldOpen() {
    return this.failures >= this.options.failureThreshold ||
      metrics.getErrorRate() >= this.options.errorPercentageThreshold;
  }

  enhanceError(error) {
    return {
      originalError: error,
      circuitBreakerState: this.state,
      timestamp: Date.now(),
      metrics: this.getMetrics(),
      bulkhead: { current: this.activeRequests, limit: this.options.bulkhead },
    };
  }

  transitionState(newState) {
    this.state = newState;
    this.lastStateChange = Date.now();
    metrics.incrementCounter(`circuit_breaker_${newState.toLowerCase()}`);
  }

  shouldAttemptReset() {
    return (Date.now() - this.lastFailureTime) > this.options.resetTimeout;
  }

  updateMetrics() {
    metrics.gauge('circuit_breaker_state', this.state);
    metrics.gauge('active_requests', this.activeRequests);
  }

  async startMonitoring() {
    setInterval(() => this.updateMetrics(), this.options.monitorInterval);
  }

  async startHealthCheck() {
    setInterval(async () => {
      if (this.state === AdvancedCircuitBreaker.States.OPEN && this.shouldAttemptReset()) {
        this.transitionState(AdvancedCircuitBreaker.States.HALF_OPEN);
      }
    }, this.options.healthCheck.interval);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  createTimeout(ms) {
    return new Promise((_, reject) => setTimeout(() => reject(new Error('⏳ Execution timeout')), ms));
  }
}

export default AdvancedCircuitBreaker;
