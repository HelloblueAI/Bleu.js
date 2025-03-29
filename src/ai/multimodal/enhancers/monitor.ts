import { Storage } from '../../../storage/storage';
import { createLogger } from '../../../utils/logger';
import { MonitorConfig, Metric, Alert } from '../../../types/monitor';
import { Logger } from '../../../utils/logger';

export interface MonitorConfig {
  interval?: number;
  retentionDays?: number;
  alertThresholds?: {
    warning: number;
    critical: number;
  };
}

export interface Metric {
  name: string;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

export interface Alert {
  type: 'warning' | 'error';
  message: string;
  metric: Metric;
  timestamp: number;
}

export class Monitor {
  private storage: Storage;
  private logger: Logger;
  private config: Required<MonitorConfig>;
  private isInitialized: boolean = false;
  private metrics: Metric[] = [];
  private alerts: Alert[] = [];
  private cleanupInterval: NodeJS.Timeout | null = null;
  private alertSystem: AlertSystem;

  constructor(storage: Storage, logger: Logger, config: MonitorConfig = {}) {
    this.storage = storage;
    this.logger = logger;
    this.config = {
      interval: config.interval ?? 60000, // Default 1 minute
      retentionDays: config.retentionDays ?? 30, // Default 30 days
      alertThresholds: config.alertThresholds ?? {
        warning: 0.8,
        critical: 0.95
      }
    };
    this.alertSystem = new AlertSystem(this.config.alertThresholds);
  }

  async initialize(): Promise<void> {
    try {
      await this.storage.initialize();
      await this.loadMetrics();
      await this.loadAlerts();
      this.isInitialized = true;
      this.logger.info('Initialized monitor');
    } catch (error) {
      this.logger.error('Failed to initialize monitor:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }

      // Save current metrics and alerts
      await this.saveMetrics();
      await this.saveAlerts();

      this.isInitialized = false;
      this.logger.info('Monitor stopped successfully');
    } catch (error) {
      this.logger.error('Failed to stop monitor:', error);
      throw error;
    }
  }

  async recordMetrics(metrics: Metric | Metric[]): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Monitor not initialized');
    }

    try {
      const timestamp = Date.now();
      const metricsArray = Array.isArray(metrics) ? metrics : [metrics];
      const metricsWithTimestamp = metricsArray.map(metric => ({
        ...metric,
        timestamp: metric.timestamp || timestamp
      }));

      this.metrics.push(...metricsWithTimestamp);

      // Check if we need to cleanup old metrics
      if (this.metrics.length > this.config.maxMetrics) {
        await this.cleanupOldMetrics();
      }

      // Check thresholds for each metric
      await Promise.all(metricsWithTimestamp.map(metric => this.checkThresholds(metric)));

      await this.saveMetrics();
      this.logger.info('Metrics recorded successfully', { count: metricsArray.length });
    } catch (error) {
      this.logger.error('Failed to record metrics:', error);
      throw error;
    }
  }

  public async getMetrics(filter?: { name?: string; labels?: Record<string, string> }): Promise<Metric[]> {
    if (!this.isInitialized) {
      throw new Error('Monitor not initialized');
    }

    try {
      let filteredMetrics = this.metrics;

      if (filter) {
        filteredMetrics = this.metrics.filter(metric => {
          if (filter.name && metric.name !== filter.name) {
            return false;
          }
          if (filter.labels) {
            for (const [key, value] of Object.entries(filter.labels)) {
              if (metric.labels?.[key] !== value) {
                return false;
              }
            }
          }
          return true;
        });
      }

      return filteredMetrics;
    } catch (error) {
      this.logger.error('Failed to get metrics:', error);
      throw error;
    }
  }

  public async getMetricsInRange(startDate: Date, endDate: Date): Promise<Metric[]> {
    if (!this.isInitialized) {
      throw new Error('Monitor not initialized');
    }

    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    return this.metrics.filter(metric => 
      metric.timestamp >= startTime && metric.timestamp <= endTime
    );
  }

  public async cleanupOldMetrics(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Monitor not initialized');
    }

    try {
      const cutoffTime = Date.now() - this.config.retentionPeriod;
      this.metrics = this.metrics.filter(metric => (metric.timestamp || 0) > cutoffTime);
      await this.saveMetrics();
      this.logger.info('Old metrics cleaned up successfully');
    } catch (error) {
      this.logger.error('Failed to cleanup old metrics:', error);
      throw error;
    }
  }

  private async checkThresholds(metric: Metric): Promise<void> {
    const thresholds = this.config.alertThresholds[metric.name];
    if (!thresholds) return;

    if (metric.value < thresholds.critical) {
      const alert: Alert = {
        type: 'error',
        message: `Critical threshold breach: ${metric.name} below ${thresholds.critical}`,
        metric,
        timestamp: Date.now()
      };
      this.alerts.push(alert);
      this.logger.error('Critical threshold breach:', alert);
    } else if (metric.value < thresholds.warning) {
      const alert: Alert = {
        type: 'warning',
        message: `Warning threshold breach: ${metric.name} below ${thresholds.warning}`,
        metric,
        timestamp: Date.now()
      };
      this.alerts.push(alert);
      this.logger.warn('Warning threshold breach:', alert);
    }
  }

  private async loadMetrics(): Promise<void> {
    try {
      const savedMetrics = await this.storage.get('metrics');
      if (savedMetrics) {
        this.metrics = savedMetrics;
      }
    } catch (error) {
      this.logger.error('Failed to load metrics:', error);
    }
  }

  private async loadAlerts(): Promise<void> {
    try {
      const savedAlerts = await this.storage.get('alerts');
      if (savedAlerts) {
        this.alerts = savedAlerts;
      }
    } catch (error) {
      this.logger.error('Failed to load alerts:', error);
    }
  }

  private async saveMetrics(): Promise<void> {
    try {
      await this.storage.save('metrics', this.metrics);
    } catch (error) {
      this.logger.error('Failed to save metrics:', error);
    }
  }

  private async saveAlerts(): Promise<void> {
    try {
      await this.storage.save('alerts', this.alerts);
    } catch (error) {
      this.logger.error('Failed to save alerts:', error);
    }
  }

  public getConfig(): MonitorConfig {
    return { ...this.config };
  }

  public isMonitored(): boolean {
    return this.isInitialized;
  }

  public async getAggregatedMetrics(): Promise<Record<string, number>> {
    if (!this.isInitialized) {
      throw new Error('Monitor not initialized');
    }

    const aggregated: Record<string, { sum: number; count: number }> = {};
    
    for (const metric of this.metrics) {
      if (!aggregated[metric.name]) {
        aggregated[metric.name] = { sum: 0, count: 0 };
      }
      aggregated[metric.name].sum += metric.value;
      aggregated[metric.name].count++;
    }

    return Object.entries(aggregated).reduce((acc, [name, { sum, count }]) => {
      acc[name] = sum / count;
      return acc;
    }, {} as Record<string, number>);
  }
}

class AlertSystem {
  private thresholds: Record<string, { critical: number; warning: number }>;
  private readonly logger = createLogger('AlertSystem');

  constructor(thresholds: Record<string, { critical: number; warning: number }>) {
    this.thresholds = thresholds;
  }

  triggerAlert(alert: Alert): void {
    this.logger.info('Alert triggered', { alert });
    // Additional alert handling logic here
  }
} 