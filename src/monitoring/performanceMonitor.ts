import { MonitoringConfig, MonitoringMetrics, Metric, TimeRange } from '../types/monitoring';
import { createLogger } from '../utils/logger';

export interface PerformanceMetrics extends MonitoringMetrics {
  cpuUsage: number;
  gpuUsage?: number;
  throughput: number;
  queueSize: number;
}

export class PerformanceMonitor {
  private config: MonitoringConfig;
  private logger = createLogger('PerformanceMonitor');
  private metrics: Map<string, Metric[]> = new Map();
  private initialized = false;

  constructor(config: MonitoringConfig) {
    this.config = {
      enabled: config.enabled || false,
      interval: config.interval || 60000,
      metrics: config.metrics || {},
      alertThresholds: {
        lowAccuracy: config.alertThresholds?.lowAccuracy || 0.8,
        highLatency: config.alertThresholds?.highLatency || 500,
        highErrorRate: config.alertThresholds?.highErrorRate || 0.1
      },
      retention: {
        metrics: config.retention?.metrics || 7 * 24 * 60 * 60 * 1000,
        alerts: config.retention?.alerts || 30 * 24 * 60 * 60 * 1000
      }
    };
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.validateConfig();
    await this.startMetricsCollection();
    this.initialized = true;
  }

  private validateConfig(): void {
    if (!this.config.enabled) {
      this.logger.warn('Performance monitoring is disabled');
      return;
    }

    if (this.config.interval < 1000) {
      throw new Error('Monitoring interval must be at least 1000ms');
    }

    if (this.config.metrics.length === 0) {
      this.logger.warn('No metrics configured for performance monitoring');
    }
  }

  private async startMetricsCollection(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    setInterval(async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        this.logger.error('Failed to collect performance metrics:', error);
      }
    }, this.config.interval);
  }

  private async collectMetrics(): Promise<void> {
    const metrics: PerformanceMetrics = {
      accuracy: Math.random(),
      latency: Math.random() * 1000,
      errorRate: Math.random() * 0.1,
      throughput: Math.random() * 1000,
      timestamp: Date.now(),
      cpuUsage: Math.random(),
      queueSize: Math.floor(Math.random() * 100)
    };

    // Store metrics
    Object.entries(metrics).forEach(([key, value]) => {
      const metric: Metric = {
        value,
        timestamp: Date.now(),
        tags: { source: 'performance' }
      };

      if (!this.metrics.has(key)) {
        this.metrics.set(key, []);
      }
      this.metrics.get(key)?.push(metric);
    });

    // Prune old data
    this.pruneHistory();
  }

  private pruneHistory(): void {
    if (!this.config.retention) {
      return;
    }

    const now = Date.now();
    const metricsRetentionMs = this.config.retention.metrics;

    // Prune metrics
    this.metrics.forEach((metrics, key) => {
      this.metrics.set(
        key,
        metrics.filter(m => now - m.timestamp <= metricsRetentionMs)
      );
    });
  }

  public getMetrics(timeRange?: TimeRange): Map<string, Metric[]> {
    if (!timeRange) {
      return this.metrics;
    }

    const filteredMetrics = new Map<string, Metric[]>();
    this.metrics.forEach((metrics, key) => {
      filteredMetrics.set(
        key,
        metrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end)
      );
    });

    return filteredMetrics;
  }

  public async dispose(): Promise<void> {
    this.metrics.clear();
    this.initialized = false;
  }
} 