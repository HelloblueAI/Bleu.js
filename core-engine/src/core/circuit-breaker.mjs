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
import { EventEmitter } from "events";
import { performance } from "perf_hooks";
import metrics from "./metrics.mjs";

class AdvancedCircuitBreaker extends EventEmitter {
  static States = {
    CLOSED: "CLOSED",
    OPEN: "OPEN",
    HALF_OPEN: "HALF_OPEN",
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
      dynamicBulkhead: options.dynamicBulkhead || true,
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
    return metrics.getMetrics();
  }

  startMonitoring() {
    this.monitorInterval = setInterval(() => {
      this.updateStatistics();
      this.emit("statistics", this.getStatistics());
    }, this.options.monitorInterval);
  }

  async execute(fn, cacheKey = null) {
    metrics.requests++;
    const startTime = performance.now();

    try {
      if (this.activeRequests > this.options.bulkhead) {
        metrics.errors++;
        throw new Error("Circuit breaker bulkhead limit exceeded");
      }

      if (this.options.cache && cacheKey) {
        const cached = this.cache.get(cacheKey);
        if (cached && cached.expires > Date.now()) {
          metrics.successfulRequests++;
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

      const result = await fn();
      const duration = performance.now() - startTime;

      metrics.trackRequest(startTime, true);
      this._onSuccess(duration);

      if (this.options.cache && cacheKey) {
        this.cache.set(cacheKey, {
          value: result,
          expires: Date.now() + this.options.cacheTTL * 1000,
        });
      }

      return result;
    } catch (error) {
      metrics.trackRequest(startTime, false);
      this._onFailure(error);
      throw error;

    }


  }

  _onSuccess(duration) {

    this.failures = 0;
    this.executionTimes.push(duration);
    if (this.executionTimes.length > 1000) {
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
    
    this.failures++;
    this.lastFailureTime = Date.now();
    this.successes = 0;

    if (
      this.failures >= this.options.failureThreshold ||
      metrics.getMetrics().errorRate >= this.options.errorPercentageThreshold
    ) {
      this._transitionState(AdvancedCircuitBreaker.States.OPEN);
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
    this.state = newState;
    this.lastStateChange = Date.now();
    this.emit("stateChange", { from: this.state, to: newState, timestamp: Date.now() });
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
    this.emit("reset");
  }
}

export default AdvancedCircuitBreaker;
