import { Storage } from "../storage/storage";
import { createLogger, CustomLogger } from "../utils/logger";
import { EventEmitter } from "events";
import { Metric, AlertThresholds } from '../types/metrics';
import { ModelMetrics } from '../types/metrics';
import { ProcessingError } from '../types/errors';
import { MonitorConfig, Alert } from './types';

export interface MonitorConfig {
  storage: {
    path: string;
    retentionDays: number;
  };
  thresholds: {
    warning: Record<string, number>;
    error: Record<string, number>;
  };
  retentionPeriod: number;
}

export class ModelMonitor extends EventEmitter {
  private readonly logger: CustomLogger;
  private readonly storage: Storage;
  private readonly metricsPrefix: string = 'model_metrics_';
  private metrics: Metric[] = [];
  private readonly alerts: Alert[] = [];
  private readonly config: MonitorConfig;
  private initialized: boolean = false;
  private isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(storage: Storage, config: MonitorConfig) {
    super();
    this.logger = new CustomLogger(createLogger({
      level: 'info'
    }));
    this.storage = storage;
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      if (this.initialized) {
        this.logger.warn('ModelMonitor already initialized');
        return;
      }

      await this.storage.initialize();
      this.initialized = true;
      this.logger.info('Initialized monitor');
    } catch (error) {
      this.logger.error('Failed to initialize model monitor:', error);
      throw new ProcessingError('Failed to initialize model monitor');
    }
  }

  async recordMetrics(metrics: Metric[]): Promise<void> {
    try {
      this.logger.info('Recording metrics');
      for (const metric of metrics) {
        await this.storage.save(`metrics:${Date.now()}`, metric);
        await this.checkThresholds(metric);
      }
      this.logger.info('Metrics recorded successfully');
    } catch (error) {
      this.logger.error('Failed to record metrics', error);
      throw error;
    }
  }

  private validateMetrics(metrics: Metric): boolean {
    return (
      typeof metrics.name === 'string' &&
      typeof metrics.value === 'number' &&
      typeof metrics.timestamp === 'number'
    );
  }

  private async checkThresholds(metric: Metric): Promise<void> {
    try {
      const threshold = this.config.thresholds[metric.name];
      if (!threshold) return;

      if (metric.value >= threshold.critical) {
        await this.generateAlert({
          level: 'critical',
          message: `Critical threshold breach for ${metric.name}: ${metric.value}`,
          timestamp: Date.now()
        });
      } else if (metric.value >= threshold.warning) {
        await this.generateAlert({
          level: 'warning',
          message: `Warning threshold breach for ${metric.name}: ${metric.value}`,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      this.logger.error('Failed to check thresholds', error);
      throw error;
    }
  }

  private async generateAlert(alert: Alert): Promise<void> {
    try {
      this.alerts.push(alert);
      await this.storage.save(`alerts:${Date.now()}`, alert);
      
      if (alert.level === 'critical') {
        this.logger.error(alert.message);
      } else {
        this.logger.warn(alert.message);
      }
    } catch (error) {
      this.logger.error('Failed to generate alert', error);
      throw error;
    }
  }

  async cleanupOldMetrics(): Promise<void> {
    try {
      this.logger.info('Cleaning up old metrics');
      const cutoffTime = Date.now() - this.config.retentionPeriod;
      const keys = await this.storage.list('metrics:');
      
      for (const key of keys) {
        const timestamp = parseInt(key.split(':')[1]);
        if (timestamp < cutoffTime) {
          await this.storage.delete(key);
        }
      }
      this.logger.info('Old metrics cleaned up');
    } catch (error) {
      this.logger.error('Failed to cleanup old metrics', error);
      throw error;
    }
  }

  async getMetricsInRange(startDate: Date, endDate: Date): Promise<Metric[]> {
    try {
      this.logger.info('Retrieving metrics in range');
      const keys = await this.storage.list('metrics:');
      const metrics: Metric[] = [];
      
      for (const key of keys) {
        const timestamp = parseInt(key.split(':')[1]);
        if (timestamp >= startDate.getTime() && timestamp <= endDate.getTime()) {
          const metric = await this.storage.get(key);
          if (metric) {
            metrics.push(metric);
          }
        }
      }
      
      this.logger.info(`Retrieved ${metrics.length} metrics`);
      return metrics;
    } catch (error) {
      this.logger.error('Failed to retrieve metrics in range', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      this.logger.info('Cleaning up model monitor');
      this.alerts = [];
      this.logger.info('Model monitor cleanup completed');
    } catch (error) {
      this.logger.error('Failed to cleanup model monitor', error);
      throw error;
    }
  }

  getAlerts(): Alert[] {
    return [...this.alerts];
  }

  async startMonitoring(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Monitor not initialized');
    }

    if (this.isMonitoring) {
      return;
    }

    try {
      this.isMonitoring = true;
      this.monitoringInterval = setInterval(() => this.collectMetrics(), 60000); // Every minute
      this.cleanupInterval = setInterval(() => this.cleanupOldMetrics(), 3600000); // Every hour
      this.logger.info('Started monitoring');
    } catch (error) {
      this.logger.error('Failed to start monitoring:', error);
      throw new Error('Failed to start monitoring');
    }
  }

  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    try {
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = undefined;
      }

      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = undefined;
      }

      this.isMonitoring = false;
      this.logger.info('Stopped monitoring');
    } catch (error) {
      this.logger.error('Failed to stop monitoring:', error);
      throw new Error('Failed to stop monitoring');
    }
  }

  private async collectMetrics(): Promise<void> {
    try {
      // This is a placeholder for actual metric collection
      // In a real implementation, this would collect metrics from the model
      const metrics: Metric = {
        name: 'accuracy',
        value: 0.95,
        timestamp: Date.now()
      };

      await this.recordMetrics([metrics]);
    } catch (error) {
      this.logger.error('Failed to collect metrics:', error);
    }
  }
}
