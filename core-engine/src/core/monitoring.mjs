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

export class MetricsCollector extends EventEmitter {
  #metrics;
  #histograms;
  #counters;
  #gauges;
  #aggregationInterval;
  #retentionPeriod;
  #tags;

  constructor(options = {}) {
    super();
    this.#metrics = new Map();
    this.#histograms = new Map();
    this.#counters = new Map();
    this.#gauges = new Map();
    this.#aggregationInterval = options.aggregationInterval || 10000; // 10 seconds
    this.#retentionPeriod = options.retentionPeriod || 3600000; // 1 hour
    this.#tags = options.tags || {};

    this.#startAggregation();
  }

  record(name, value, tags = {}) {
    try {
      if (typeof value !== 'number' || isNaN(value)) {
        throw new Error(`Invalid metric value for ${name}: ${value}`);
      }

      const metricKey = this.#formatMetricKey(name, tags);
      const timestamp = Date.now();

      const metric = this.#metrics.get(metricKey) || this.#createMetricObject();

      this.#updateMetric(metric, value, timestamp);
      this.#metrics.set(metricKey, metric);

      // Automatically create histogram for every metric
      this.histogram(name, value, tags);

      this.emit('metric:recorded', {
        name,
        value,
        tags: { ...this.#tags, ...tags },
        timestamp
      });
    } catch (error) {
      this.emit('error', error);
    }
  }

  histogram(name, value, tags = {}) {
    try {
      const histKey = this.#formatMetricKey(name, tags);
      const hist = this.#histograms.get(histKey) || new Map();

      // Use dynamic bucket sizing based on value range
      const bucketSize = this.#calculateBucketSize(value);
      const bucket = Math.floor(value / bucketSize) * bucketSize;

      hist.set(bucket, (hist.get(bucket) || 0) + 1);
      this.#histograms.set(histKey, hist);

      this.emit('histogram:updated', {
        name,
        bucket,
        count: hist.get(bucket),
        tags: { ...this.#tags, ...tags }
      });
    } catch (error) {
      this.emit('error', error);
    }
  }

  counter(name, increment = 1, tags = {}) {
    try {
      const counterKey = this.#formatMetricKey(name, tags);
      const current = this.#counters.get(counterKey) || 0;
      const newValue = current + increment;

      this.#counters.set(counterKey, newValue);

      this.emit('counter:updated', {
        name,
        value: newValue,
        increment,
        tags: { ...this.#tags, ...tags }
      });
    } catch (error) {
      this.emit('error', error);
    }
  }

  gauge(name, value, tags = {}) {
    try {
      const gaugeKey = this.#formatMetricKey(name, tags);

      this.#gauges.set(gaugeKey, {
        value,
        timestamp: Date.now(),
        tags: { ...this.#tags, ...tags }
      });

      this.emit('gauge:updated', {
        name,
        value,
        tags: { ...this.#tags, ...tags }
      });
    } catch (error) {
      this.emit('error', error);
    }
  }

  getMetrics(options = {}) {
    const { includeRaw = false, filter } = options;
    const now = Date.now();
    const cutoff = now - this.#retentionPeriod;

    const filteredMetrics = this.#filterMetrics(this.#metrics, filter, cutoff);
    const filteredHistograms = this.#filterMetrics(this.#histograms, filter, cutoff);
    const filteredCounters = this.#filterMetrics(this.#counters, filter);
    const filteredGauges = this.#filterMetrics(this.#gauges, filter, cutoff);

    const metrics = {
      timestamp: now,
      metrics: this.#formatMetrics(filteredMetrics, includeRaw),
      histograms: Object.fromEntries(filteredHistograms),
      counters: Object.fromEntries(filteredCounters),
      gauges: Object.fromEntries(filteredGauges)
    };

    this.emit('metrics:retrieved', metrics);
    return metrics;
  }

  #createMetricObject() {
    return {
      count: 0,
      sum: 0,
      min: Infinity,
      max: -Infinity,
      p95: 0,
      p99: 0,
      stddev: 0,
      values: [],
      lastUpdated: Date.now()
    };
  }

  #updateMetric(metric, value, timestamp) {
    metric.count++;
    metric.sum += value;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    metric.values.push({ value, timestamp });

    // Maintain sliding window
    metric.values = metric.values.filter(v =>
      v.timestamp > timestamp - this.#retentionPeriod
    );

    this.#calculatePercentiles(metric);
    this.#calculateStdDev(metric);
    metric.lastUpdated = timestamp;
  }

  #calculatePercentiles(metric) {
    if (metric.values.length === 0) return;

    const sorted = [...metric.values].sort((a, b) => a.value - b.value);
    metric.p95 = sorted[Math.floor(sorted.length * 0.95)]?.value || 0;
    metric.p99 = sorted[Math.floor(sorted.length * 0.99)]?.value || 0;
  }

  #calculateStdDev(metric) {
    if (metric.count === 0) return;

    const mean = metric.sum / metric.count;
    const squareDiffs = metric.values.map(v => Math.pow(v.value - mean, 2));
    metric.stddev = Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / metric.count);
  }

  #calculateBucketSize(value) {
    const magnitude = Math.floor(Math.log10(Math.abs(value) || 1));
    return Math.pow(10, magnitude - 1);
  }

  #formatMetricKey(name, tags) {
    const tagString = Object.entries({ ...this.#tags, ...tags })
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return tagString ? `${name}{${tagString}}` : name;
  }

  #filterMetrics(metricMap, filter, cutoff = null) {
    return new Map(
      Array.from(metricMap.entries())
        .filter(([key, value]) => {
          if (cutoff && value.lastUpdated && value.lastUpdated < cutoff) {
            return false;
          }
          if (filter && typeof filter === 'function') {
            return filter(key, value);
          }
          return true;
        })
    );
  }

  #formatMetrics(metrics, includeRaw = false) {
    const formatted = {};
    metrics.forEach((value, key) => {
      formatted[key] = {
        count: value.count,
        sum: value.sum,
        min: value.min,
        max: value.max,
        avg: value.count > 0 ? value.sum / value.count : 0,
        p95: value.p95,
        p99: value.p99,
        stddev: value.stddev,
        lastUpdated: value.lastUpdated
      };
      if (includeRaw) {
        formatted[key].values = value.values;
      }
    });
    return formatted;
  }

  #startAggregation() {
    setInterval(() => {
      try {
        const metrics = this.getMetrics();
        this.emit('metrics:aggregated', metrics);
      } catch (error) {
        this.emit('error', error);
      }
    }, this.#aggregationInterval);
  }

  // Additional utility methods
  resetMetric(name, tags = {}) {
    const key = this.#formatMetricKey(name, tags);
    this.#metrics.delete(key);
    this.#histograms.delete(key);
    this.#counters.delete(key);
    this.#gauges.delete(key);
  }

  setGlobalTags(tags) {
    this.#tags = { ...this.#tags, ...tags };
  }

  on(event, listener) {
    super.on(event, listener);
    return this; // Enable chaining
  }
}

// Export singleton instance
export const metrics = new MetricsCollector();
