import { createLogger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

const logger = createLogger('ModelMonitor');

export interface MonitoringConfig {
  modelId: string;
  storageDirectory?: string;
  logInterval?: number;
  metrics?: string[];
  thresholds?: {
    [key: string]: {
      warning: number;
      critical: number;
    };
  };
  alertingEnabled?: boolean;
}

export interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
}

export interface Alert {
  type: 'warning' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
}

export class ModelMonitor extends EventEmitter {
  private config: Required<MonitoringConfig>;
  private monitoring: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private metrics: MetricData[] = [];
  private alerts: Alert[] = [];

  constructor(config: MonitoringConfig) {
    super();
    if (!config.modelId) {
      throw new Error('modelId is required');
    }
    this.config = {
      modelId: config.modelId,
      storageDirectory: config.storageDirectory || path.join(process.cwd(), 'monitoring', config.modelId),
      logInterval: config.logInterval || 60000,
      metrics: config.metrics || ['accuracy', 'latency', 'memoryUsage', 'cpuUsage', 'errorRate', 'throughput'],
      thresholds: {
        accuracy: { warning: 0.8, critical: 0.6 },
        latency: { warning: 1000, critical: 2000 },
        memoryUsage: { warning: 80, critical: 90 },
        cpuUsage: { warning: 80, critical: 90 },
        errorRate: { warning: 0.1, critical: 0.2 },
        throughput: { warning: 100, critical: 50 },
        ...config.thresholds
      },
      alertingEnabled: config.alertingEnabled ?? true
    };
  }

  get isMonitoring(): boolean {
    return this.monitoring;
  }

  getMonitoredModels(): string[] {
    return [this.config.modelId];
  }

  async startMonitoring(): Promise<void> {
    if (this.monitoring) {
      throw new Error('Monitoring is already active');
    }

    try {
      await fs.mkdir(this.config.storageDirectory, { recursive: true });
      this.metrics = [];
      this.alerts = [];
      this.monitoring = true;
      this.intervalId = setInterval(() => {
        this.collectMetrics().catch(error => {
          logger.error('Failed to collect metrics:', error);
        });
      }, this.config.logInterval);
      logger.info('Started monitoring');
    } catch (error) {
      logger.error('Failed to start monitoring:', error);
      throw error;
    }
  }

  async stopMonitoring(): Promise<void> {
    if (!this.monitoring) {
      throw new Error('Monitoring is not active');
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.monitoring = false;
    await this.saveData();
    logger.info('Stopped monitoring');
  }

  async recordMetric(name: string, value: number, metadata?: any): Promise<void> {
    if (!this.monitoring) {
      throw new Error('Monitoring is not running');
    }

    if (!this.config.metrics.includes(name)) {
      throw new Error(`Invalid metric: ${name}`);
    }

    const metric: MetricData = {
      name,
      value,
      timestamp: new Date()
    };

    this.metrics.push(metric);
    await this.checkThresholds(metric);
    await this.saveData();
  }

  getMetrics(options?: { startTime?: Date; endTime?: Date; metric?: string }): MetricData[] {
    let filteredMetrics = [...this.metrics];

    if (options?.startTime) {
      filteredMetrics = filteredMetrics.filter(m => m.timestamp >= options.startTime!);
    }

    if (options?.endTime) {
      filteredMetrics = filteredMetrics.filter(m => m.timestamp <= options.endTime!);
    }

    if (options?.metric) {
      filteredMetrics = filteredMetrics.filter(m => m.name === options.metric);
    }

    return filteredMetrics;
  }

  getAlerts(options?: { startTime?: Date; endTime?: Date; type?: 'warning' | 'critical' }): Alert[] {
    let filteredAlerts = [...this.alerts];

    if (options?.startTime) {
      filteredAlerts = filteredAlerts.filter(a => a.timestamp >= options.startTime!);
    }

    if (options?.endTime) {
      filteredAlerts = filteredAlerts.filter(a => a.timestamp <= options.endTime!);
    }

    if (options?.type) {
      filteredAlerts = filteredAlerts.filter(a => a.type === options.type);
    }

    return filteredAlerts;
  }

  generateMetricsSummary(): { [key: string]: { min: number; max: number; avg: number } } {
    const summary: { [key: string]: { min: number; max: number; avg: number } } = {};

    for (const metric of this.config.metrics) {
      const values = this.metrics
        .filter(m => m.name === metric)
        .map(m => m.value);

      if (values.length > 0) {
        summary[metric] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length
        };
      }
    }

    return summary;
  }

  generateReport(): { 
    modelId: string;
    metrics: { [key: string]: { min: number; max: number; avg: number } };
    alerts: { warning: number; critical: number };
    lastUpdated: Date;
  } {
    const metrics = this.generateMetricsSummary();
    const alerts = this.getAlerts();
    const warningAlerts = alerts.filter(a => a.type === 'warning').length;
    const criticalAlerts = alerts.filter(a => a.type === 'critical').length;
    
    return {
      modelId: this.config.modelId,
      metrics,
      alerts: {
        warning: warningAlerts,
        critical: criticalAlerts
      },
      lastUpdated: new Date()
    };
  }

  updateThresholds(thresholds: { [key: string]: { warning: number; critical: number } }): void {
    this.config.thresholds = {
      ...this.config.thresholds,
      ...thresholds
    };
  }

  updateMonitoringInterval(interval: number): void {
    if (interval <= 0) {
      throw new Error('Interval must be greater than 0');
    }

    this.config.logInterval = interval;
    if (this.monitoring) {
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
      this.intervalId = setInterval(() => {
        this.collectMetrics().catch(error => {
          logger.error('Failed to collect metrics:', error);
        });
      }, interval);
    }
  }

  toggleAlerting(enabled: boolean): void {
    this.config.alertingEnabled = enabled;
  }

  private async collectMetrics(): Promise<void> {
    try {
      for (const metric of this.config.metrics) {
        const value = await this.getCurrentMetricValue(metric);
        await this.recordMetric(metric, value);
      }
    } catch (error) {
      logger.error('Failed to collect metrics:', error);
      throw error;
    }
  }

  private async getCurrentMetricValue(metric: string): Promise<number> {
    switch (metric) {
      case 'accuracy':
        return Math.random();
      case 'latency':
        return Math.random() * 200;
      case 'memoryUsage':
        return Math.random() * 1000;
      case 'cpuUsage':
        return Math.random() * 100;
      case 'errorRate':
        return Math.random() * 0.2;
      case 'throughput':
        return Math.random() * 2000;
      default:
        return 0;
    }
  }

  private async checkThresholds(metric: MetricData): Promise<void> {
    if (!this.config.alertingEnabled) return;

    const thresholds = this.config.thresholds[metric.name];
    if (!thresholds) return;

    if (metric.value <= thresholds.critical) {
      await this.createAlert('critical', `${metric.name} is critically low`, metric);
    } else if (metric.value <= thresholds.warning) {
      await this.createAlert('warning', `${metric.name} is below warning threshold`, metric);
    }
  }

  private async createAlert(type: 'warning' | 'critical', message: string, metric: MetricData): Promise<void> {
    const alert: Alert = {
      type,
      message,
      metric: metric.name,
      value: metric.value,
      threshold: type === 'warning' 
        ? this.config.thresholds[metric.name].warning
        : this.config.thresholds[metric.name].critical,
      timestamp: new Date()
    };

    this.alerts.push(alert);
    logger.warn('Alert generated:', alert);
    this.emit('alert', alert);
    await this.saveData();
  }

  private async saveData(): Promise<void> {
    try {
      const data = {
        modelId: this.config.modelId,
        metrics: this.metrics,
        alerts: this.alerts,
        lastUpdated: new Date()
      };

      await fs.writeFile(
        path.join(this.config.storageDirectory, 'monitoring.json'),
        JSON.stringify(data, null, 2)
      );
    } catch (error) {
      logger.error('Failed to save monitoring data:', error);
      throw error;
    }
  }

  async cleanupOldData(retentionDays: number = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoffDate);
    this.alerts = this.alerts.filter(a => a.timestamp >= cutoffDate);
    
    try {
      const files = await fs.readdir(this.config.storageDirectory);
      for (const file of files) {
        const filePath = path.join(this.config.storageDirectory, file);
        const stats = await fs.stat(filePath);
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup old data:', error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    if (this.monitoring) {
      await this.stopMonitoring();
    }
    this.metrics = [];
    this.alerts = [];
    logger.info('Model monitor disposed successfully');
  }
} 