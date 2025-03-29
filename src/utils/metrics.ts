import { MonitoringMetrics } from '../types';
import { createLogger } from './logger';
import { SecurityError } from '../types/errors';

const logger = createLogger('Metrics');

export interface MetricsConfig {
  maxMetricsAge?: number;
  aggregationInterval?: number;
  maxMetricsCount?: number;
  enableCompression?: boolean;
}

export class MetricsManager {
  private readonly metrics: Map<string, MonitoringMetrics[]>;
  private readonly config: MetricsConfig;
  private readonly DEFAULT_MAX_AGE: number = 24 * 60 * 60 * 1000; // 24 hours
  private readonly DEFAULT_AGGREGATION_INTERVAL: number = 5 * 60 * 1000; // 5 minutes
  private readonly DEFAULT_MAX_COUNT: number = 1000;

  constructor(config: MetricsConfig = {}) {
    this.config = {
      maxMetricsAge: config.maxMetricsAge ?? this.DEFAULT_MAX_AGE,
      aggregationInterval: config.aggregationInterval ?? this.DEFAULT_AGGREGATION_INTERVAL,
      maxMetricsCount: config.maxMetricsCount ?? this.DEFAULT_MAX_COUNT,
      enableCompression: config.enableCompression ?? true
    };
    this.metrics = new Map();
  }

  private validateMetrics(metrics: MonitoringMetrics): void {
    if (!metrics || typeof metrics !== 'object') {
      throw new SecurityError('Invalid metrics format', 'INVALID_METRICS');
    }

    // Validate CPU metrics
    if (typeof metrics.cpu?.usage !== 'number' || metrics.cpu.usage < 0 || metrics.cpu.usage > 100) {
      throw new SecurityError('Invalid CPU usage metric', 'INVALID_CPU_METRIC');
    }
    if (!Array.isArray(metrics.cpu?.load) || metrics.cpu.load.length !== 3) {
      throw new SecurityError('Invalid CPU load metric', 'INVALID_CPU_METRIC');
    }

    // Validate memory metrics
    if (typeof metrics.memory?.used !== 'number' || metrics.memory.used < 0) {
      throw new SecurityError('Invalid memory usage metric', 'INVALID_MEMORY_METRIC');
    }
    if (typeof metrics.memory?.total !== 'number' || metrics.memory.total <= 0) {
      throw new SecurityError('Invalid memory total metric', 'INVALID_MEMORY_METRIC');
    }

    // Validate response time metrics
    const responseTimeFields = ['p50', 'p90', 'p95', 'p99'];
    for (const field of responseTimeFields) {
      if (typeof metrics.responseTime?.[field] !== 'number' || metrics.responseTime[field] < 0) {
        throw new SecurityError(`Invalid response time metric: ${field}`, 'INVALID_RESPONSE_TIME_METRIC');
      }
    }

    // Validate request metrics
    if (typeof metrics.requests?.total !== 'number' || metrics.requests.total < 0) {
      throw new SecurityError('Invalid total requests metric', 'INVALID_REQUESTS_METRIC');
    }
    if (typeof metrics.requests?.success !== 'number' || metrics.requests.success < 0) {
      throw new SecurityError('Invalid successful requests metric', 'INVALID_REQUESTS_METRIC');
    }
    if (typeof metrics.requests?.error !== 'number' || metrics.requests.error < 0) {
      throw new SecurityError('Invalid error requests metric', 'INVALID_REQUESTS_METRIC');
    }
  }

  private aggregateMetrics(metrics: MonitoringMetrics[]): MonitoringMetrics {
    const count = metrics.length;
    if (count === 0) return generateMetrics();

    const aggregated: MonitoringMetrics = {
      cpu: {
        usage: 0,
        load: [0, 0, 0]
      },
      memory: {
        used: 0,
        total: metrics[0].memory.total,
        heapUsed: 0,
        heapTotal: 0
      },
      responseTime: {
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0
      },
      requests: {
        total: 0,
        success: 0,
        error: 0,
        rate: 0
      }
    };

    for (const metric of metrics) {
      // Aggregate CPU metrics
      aggregated.cpu.usage += metric.cpu.usage;
      for (let i = 0; i < 3; i++) {
        aggregated.cpu.load[i] += metric.cpu.load[i];
      }

      // Aggregate memory metrics
      aggregated.memory.used += metric.memory.used;
      aggregated.memory.heapUsed += metric.memory.heapUsed || 0;
      aggregated.memory.heapTotal += metric.memory.heapTotal || 0;

      // Aggregate response time metrics
      aggregated.responseTime.p50 += metric.responseTime.p50;
      aggregated.responseTime.p90 += metric.responseTime.p90;
      aggregated.responseTime.p95 += metric.responseTime.p95;
      aggregated.responseTime.p99 += metric.responseTime.p99;

      // Aggregate request metrics
      aggregated.requests.total += metric.requests.total;
      aggregated.requests.success += metric.requests.success;
      aggregated.requests.error += metric.requests.error;
      aggregated.requests.rate += metric.requests.rate || 0;
    }

    // Calculate averages
    aggregated.cpu.usage /= count;
    for (let i = 0; i < 3; i++) {
      aggregated.cpu.load[i] /= count;
    }
    aggregated.memory.used /= count;
    aggregated.memory.heapUsed /= count;
    aggregated.memory.heapTotal /= count;
    aggregated.responseTime.p50 /= count;
    aggregated.responseTime.p90 /= count;
    aggregated.responseTime.p95 /= count;
    aggregated.responseTime.p99 /= count;
    aggregated.requests.rate /= count;

    return aggregated;
  }

  private cleanOldMetrics(): void {
    const now = Date.now();
    for (const [key, metrics] of this.metrics.entries()) {
      const filtered = metrics.filter(metric => 
        now - metric.timestamp < this.config.maxMetricsAge!
      );
      if (filtered.length !== metrics.length) {
        this.metrics.set(key, filtered);
        logger.info(`Cleaned ${metrics.length - filtered.length} old metrics for ${key}`);
      }
    }
  }

  public addMetrics(key: string, metrics: MonitoringMetrics): void {
    try {
      this.validateMetrics(metrics);
      this.cleanOldMetrics();

      const existingMetrics = this.metrics.get(key) || [];
      existingMetrics.push({ ...metrics, timestamp: Date.now() });

      if (existingMetrics.length > this.config.maxMetricsCount!) {
        existingMetrics.splice(0, existingMetrics.length - this.config.maxMetricsCount!);
      }

      this.metrics.set(key, existingMetrics);
      logger.debug(`Added metrics for ${key}`);
    } catch (error) {
      logger.error('Error adding metrics:', error);
      throw new SecurityError('Failed to add metrics', 'METRICS_ERROR');
    }
  }

  public getMetrics(key: string, timeRange?: { start: number; end: number }): MonitoringMetrics[] {
    try {
      const metrics = this.metrics.get(key) || [];
      if (!timeRange) return metrics;

      return metrics.filter(metric => 
        metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
      );
    } catch (error) {
      logger.error('Error getting metrics:', error);
      throw new SecurityError('Failed to get metrics', 'METRICS_ERROR');
    }
  }

  public getAggregatedMetrics(key: string, timeRange?: { start: number; end: number }): MonitoringMetrics {
    try {
      const metrics = this.getMetrics(key, timeRange);
      return this.aggregateMetrics(metrics);
    } catch (error) {
      logger.error('Error getting aggregated metrics:', error);
      throw new SecurityError('Failed to get aggregated metrics', 'METRICS_ERROR');
    }
  }

  public clearMetrics(key?: string): void {
    if (key) {
      this.metrics.delete(key);
      logger.info(`Cleared metrics for ${key}`);
    } else {
      this.metrics.clear();
      logger.info('Cleared all metrics');
    }
  }
}

export function generateMetrics(): MonitoringMetrics {
  return {
    cpu: {
      usage: 0,
      load: [0, 0, 0]
    },
    memory: {
      used: 0,
      total: 0,
      heapUsed: 0,
      heapTotal: 0
    },
    responseTime: {
      p50: 0,
      p90: 0,
      p95: 0,
      p99: 0
    },
    requests: {
      total: 0,
      success: 0,
      error: 0,
      rate: 0
    }
  };
} 