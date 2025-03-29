import { createLogger } from '../utils/logger';
import { Metric, AlertThresholds } from '../types/metrics';

export interface MonitorConfig {
  monitoringInterval?: number;
  alertThresholds?: AlertThresholds;
  retentionPeriod?: number;
  maxMetrics?: number;
}

export class Monitor {
  private config: Required<MonitorConfig>;
  private metrics: Metric[] = [];
  private readonly logger = createLogger('Monitor');
  private isInitialized: boolean = false;

  constructor(config: MonitorConfig = {}) {
    this.config = {
      monitoringInterval: config.monitoringInterval || 60000,
      alertThresholds: config.alertThresholds || {
        accuracy: { critical: 0.8, warning: 0.9 },
        latency: { critical: 1000, warning: 500 }
      },
      retentionPeriod: config.retentionPeriod || 86400000, // 24 hours
      maxMetrics: config.maxMetrics || 1000
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.info('Monitor already initialized');
      return;
    }

    try {
      await this.loadMetrics();
      this.isInitialized = true;
      this.logger.info('Monitor initialized');
    } catch (error) {
      this.logger.error('Failed to initialize monitor:', error);
      throw new Error('Monitor initialization failed');
    }
  }

  async recordMetrics(metrics: Metric[]): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Monitor not initialized');
    }

    try {
      const timestamp = new Date();
      metrics.forEach(metric => {
        this.metrics.push({
          ...metric,
          timestamp
        });
      });

      await this.cleanupOldMetrics();
      await this.checkThresholds(metrics);
      await this.saveMetrics();
      this.logger.info(`Recorded ${metrics.length} metrics`);
    } catch (error) {
      this.logger.error('Failed to record metrics:', error);
      throw new Error('Failed to record metrics');
    }
  }

  async cleanupOldMetrics(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Monitor not initialized');
    }

    try {
      const cutoffTime = new Date(Date.now() - this.config.retentionPeriod);
      this.metrics = this.metrics.filter(metric => metric.timestamp >= cutoffTime);
      
      if (this.metrics.length > this.config.maxMetrics) {
        this.metrics = this.metrics.slice(-this.config.maxMetrics);
      }

      await this.saveMetrics();
      this.logger.info('Cleaned up old metrics');
    } catch (error) {
      this.logger.error('Failed to cleanup old metrics:', error);
      throw new Error('Failed to cleanup old metrics');
    }
  }

  async getMetricsInRange(startTime: Date, endTime: Date): Promise<Metric[]> {
    if (!this.isInitialized) {
      throw new Error('Monitor not initialized');
    }

    try {
      return this.metrics.filter(metric => 
        metric.timestamp >= startTime && metric.timestamp <= endTime
      );
    } catch (error) {
      this.logger.error('Failed to get metrics in range:', error);
      throw new Error('Failed to get metrics in range');
    }
  }

  private async checkThresholds(metrics: Metric[]): Promise<void> {
    for (const metric of metrics) {
      const threshold = this.config.alertThresholds[metric.name];
      if (!threshold) continue;

      if (metric.value <= threshold.critical) {
        this.logger.warn(`Critical threshold breached for ${metric.name}: ${metric.value}`);
      } else if (metric.value <= threshold.warning) {
        this.logger.warn(`Warning threshold breached for ${metric.name}: ${metric.value}`);
      }
    }
  }

  private async saveMetrics(): Promise<void> {
    try {
      // Implementation for saving metrics to storage
      this.logger.debug('Saved metrics to storage');
    } catch (error) {
      this.logger.error('Failed to save metrics:', error);
      throw new Error('Failed to save metrics');
    }
  }

  private async loadMetrics(): Promise<void> {
    try {
      // Implementation for loading metrics from storage
      this.metrics = [];
      this.logger.debug('Loaded metrics from storage');
    } catch (error) {
      this.logger.error('Failed to load metrics:', error);
      this.metrics = [];
    }
  }
} 