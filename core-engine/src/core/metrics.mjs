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
// core/metrics.mjs
import os from 'os';
import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';

class Metrics extends EventEmitter {
  constructor() {
    super();
    // Core metrics
    this.metrics = {
      requests: 0,
      errors: 0,
      successfulRequests: 0,
      executionTimes: [],
      circuitBreakerStats: new Map(),
      endpointStats: new Map(),
      requestsPerMinute: new Map(),
      lastMinuteRequests: []
    };

    // System metrics
    this.systemStats = this.getSystemStats();
    this.lastUpdated = Date.now();

    // Configuration
    this.config = {
      maxHistorySize: 1000,
      updateInterval: 5000,
      alertThresholds: {
        errorRate: 20,
        responseTime: 1000,
        cpuUsage: 80,
        memoryUsage: 80
      }
    };

    this.startMonitoring();
  }

  startMonitoring() {
    // System metrics monitoring
    setInterval(() => {
      this.systemStats = this.getSystemStats();
      this.checkAlerts();
      this.emit('metricsUpdate', this.getMetrics());
    }, this.config.updateInterval);

    // Requests per minute calculation
    setInterval(() => {
      this.calculateRequestRate();
    }, 60000);
  }

  getSystemStats() {
    const cpuUsage = process.cpuUsage();
    const memUsage = process.memoryUsage();

    return {
      cpu: {
        user: cpuUsage.user / 1000000,
        system: cpuUsage.system / 1000000,
        loadAverage: os.loadavg(),
        cores: os.cpus().length
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: memUsage.heapUsed,
        rss: memUsage.rss,
        utilization: ((memUsage.heapUsed / os.totalmem()) * 100).toFixed(2)
      },
      uptime: os.uptime(),
      platform: {
        type: os.type(),
        platform: os.platform(),
        release: os.release()
      }
    };
  }

  trackRequest(startTime, success = true, metadata = {}) {
    const { endpoint = 'unknown', circuitBreaker = null } = metadata;
    const duration = performance.now() - startTime;
    const timestamp = Date.now();

    // Update core metrics
    this.metrics.requests++;
    success ? this.metrics.successfulRequests++ : this.metrics.errors++;
    this.metrics.executionTimes.push(duration);

    // Maintain history size
    if (this.metrics.executionTimes.length > this.config.maxHistorySize) {
      this.metrics.executionTimes.shift();
    }

    // Track per-endpoint metrics
    this.updateEndpointStats(endpoint, duration, success);

    // Track circuit breaker stats
    if (circuitBreaker) {
      this.updateCircuitBreakerStats(circuitBreaker);
    }

    // Track requests per minute
    this.metrics.lastMinuteRequests.push(timestamp);
    this.metrics.lastMinuteRequests = this.metrics.lastMinuteRequests.filter(
      time => time > timestamp - 60000
    );

    this.lastUpdated = timestamp;

    // Emit real-time metrics for monitoring
    this.emit('requestComplete', {
      duration,
      success,
      endpoint,
      timestamp
    });
  }

  updateEndpointStats(endpoint, duration, success) {
    if (!this.metrics.endpointStats.has(endpoint)) {
      this.metrics.endpointStats.set(endpoint, {
        requests: 0,
        errors: 0,
        totalDuration: 0,
        lastUpdate: Date.now()
      });
    }

    const stats = this.metrics.endpointStats.get(endpoint);
    stats.requests++;
    if (!success) stats.errors++;
    stats.totalDuration += duration;
    stats.lastUpdate = Date.now();
  }

  updateCircuitBreakerStats(circuitBreaker) {
    const stats = {
      state: circuitBreaker.state,
      failures: circuitBreaker.failures,
      successes: circuitBreaker.successes,
      lastStateChange: circuitBreaker.lastStateChange
    };
    this.metrics.circuitBreakerStats.set(circuitBreaker.name || 'default', stats);
  }

  calculateRequestRate() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const requestsLastMinute = this.metrics.lastMinuteRequests.filter(
      time => time > oneMinuteAgo
    ).length;

    this.metrics.requestsPerMinute.set(now, requestsLastMinute);

    // Keep only last hour of rate data
    const oneHourAgo = now - 3600000;
    for (const [timestamp] of this.metrics.requestsPerMinute) {
      if (timestamp < oneHourAgo) {
        this.metrics.requestsPerMinute.delete(timestamp);
      }
    }
  }

  checkAlerts() {
    const metrics = this.getMetrics();
    const alerts = [];

    // Check error rate
    if (parseFloat(metrics.errorRate) > this.config.alertThresholds.errorRate) {
      alerts.push({
        type: 'ERROR_RATE',
        value: metrics.errorRate,
        threshold: this.config.alertThresholds.errorRate
      });
    }

    // Check response time
    if (metrics.percentiles.P95 > this.config.alertThresholds.responseTime) {
      alerts.push({
        type: 'RESPONSE_TIME',
        value: metrics.percentiles.P95,
        threshold: this.config.alertThresholds.responseTime
      });
    }

    // Check system metrics
    if (parseFloat(metrics.systemStats.memory.utilization) > this.config.alertThresholds.memoryUsage) {
      alerts.push({
        type: 'MEMORY_USAGE',
        value: metrics.systemStats.memory.utilization,
        threshold: this.config.alertThresholds.memoryUsage
      });
    }

    if (alerts.length > 0) {
      this.emit('alerts', alerts);
    }
  }

  getResponseTimePercentiles() {
    if (this.metrics.executionTimes.length === 0) return {};

    const sorted = [...this.metrics.executionTimes].sort((a, b) => a - b);
    return {
      P50: sorted[Math.floor(0.5 * sorted.length)] || 0,
      P75: sorted[Math.floor(0.75 * sorted.length)] || 0,
      P90: sorted[Math.floor(0.9 * sorted.length)] || 0,
      P95: sorted[Math.floor(0.95 * sorted.length)] || 0,
      P99: sorted[Math.floor(0.99 * sorted.length)] || 0
    };
  }

  getMetrics() {
    const errorRate = this.metrics.requests > 0
      ? (this.metrics.errors / this.metrics.requests * 100)
      : 0;

    return {
      general: {
        requests: this.metrics.requests,
        successfulRequests: this.metrics.successfulRequests,
        errors: this.metrics.errors,
        errorRate: errorRate.toFixed(2) + '%',
        requestsPerMinute: this.metrics.lastMinuteRequests.length
      },
      timing: {
        avgResponseTime: (
          this.metrics.executionTimes.reduce((a, b) => a + b, 0) /
          this.metrics.executionTimes.length || 0
        ).toFixed(2) + ' ms',
        percentiles: this.getResponseTimePercentiles()
      },
      endpoints: Object.fromEntries(this.metrics.endpointStats),
      circuitBreakers: Object.fromEntries(this.metrics.circuitBreakerStats),
      systemStats: this.systemStats,
      lastUpdated: new Date(this.lastUpdated).toISOString()
    };
  }
}

const metrics = new Metrics();
export default metrics;
