export class MetricsCollector {
  constructor() {
    this.metrics = new Map();
    this.histograms = new Map();
    this.counters = new Map();
    this.gauges = new Map();
  }

  record(name, value, type = 'metric') {
    const metric = this.metrics.get(name) || {
      count: 0,
      sum: 0,
      min: Infinity,
      max: -Infinity,
      p95: 0,
      p99: 0,
      stddev: 0,
      values: [],
    };

    metric.count++;
    metric.sum += value;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    metric.values.push(value);

    if (metric.values.length > 1000) metric.values.shift();

    const sorted = [...metric.values].sort((a, b) => a - b);
    metric.p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    metric.p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;

    const mean = metric.sum / metric.count;
    const squareDiffs = metric.values.map((x) => Math.pow(x - mean, 2));
    metric.stddev = Math.sqrt(
      squareDiffs.reduce((a, b) => a + b, 0) / metric.count,
    );

    this.metrics.set(name, metric);
  }

  histogram(name, value) {
    const hist = this.histograms.get(name) || new Map();
    const bucket = Math.floor(value / 100) * 100;
    hist.set(bucket, (hist.get(bucket) || 0) + 1);
    this.histograms.set(name, hist);
  }

  counter(name, increment = 1) {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + increment);
  }

  gauge(name, value) {
    this.gauges.set(name, value);
  }

  getMetrics() {
    return {
      metrics: Object.fromEntries(this.metrics),
      histograms: Object.fromEntries(this.histograms),
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
    };
  }
}
