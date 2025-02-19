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
import os from "os";
import { performance } from "perf_hooks";
import { EventEmitter } from "events";

class Metrics extends EventEmitter {
  constructor() {
    super();
    this.requests = 0;
    this.errors = 0;
    this.successfulRequests = 0;
    this.executionTimes = [];
    this.systemStats = this.getSystemStats();
    this.lastUpdated = Date.now();

    this.startMonitoring();
  }

  startMonitoring() {
    setInterval(() => {
      this.systemStats = this.getSystemStats();
      this.emit("metricsUpdate", this.getMetrics());
    }, 5000);
  }

  getSystemStats() {
    return {
      cpuUsage: process.cpuUsage(),
      memoryUsage: process.memoryUsage(),
      loadAverage: os.loadavg(),
      uptime: os.uptime(),
    };
  }

  trackRequest(startTime, success = true) {
    this.requests++;
    const duration = performance.now() - startTime;
    this.executionTimes.push(duration);

    if (success) {
      this.successfulRequests++;
    } else {
      this.errors++;
    }

    if (this.executionTimes.length > 1000) {
      this.executionTimes.shift(); // Keep recent 1000 requests for percentile tracking
    }

    this.lastUpdated = Date.now();
  }

  getResponseTimePercentiles() {
    if (this.executionTimes.length === 0) return {};

    const sorted = [...this.executionTimes].sort((a, b) => a - b);
    return {
      P50: sorted[Math.floor(0.50 * sorted.length)] || 0,
      P75: sorted[Math.floor(0.75 * sorted.length)] || 0,
      P90: sorted[Math.floor(0.90 * sorted.length)] || 0,
      P95: sorted[Math.floor(0.95 * sorted.length)] || 0,
      P99: sorted[Math.floor(0.99 * sorted.length)] || 0,
    };
  }

  getMetrics() {
    const errorRate = this.requests > 0 ? (this.errors / this.requests) * 100 : 0;
    const percentiles = this.getResponseTimePercentiles();

    return {
      requests: this.requests,
      successfulRequests: this.successfulRequests,
      errors: this.errors,
      errorRate: errorRate.toFixed(2) + "%",
      avgResponseTime: (this.executionTimes.reduce((a, b) => a + b, 0) / this.executionTimes.length || 0).toFixed(2) + " ms",
      percentiles,
      systemStats: this.systemStats,
      lastUpdated: new Date(this.lastUpdated).toISOString(),
    };
  }
}

const metrics = new Metrics();
export default metrics;
