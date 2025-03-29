import { Logger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

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
  private readonly logger: Logger;
  private config: Required<MonitoringConfig>;
  private monitoring: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private metrics: MetricData[] = [];
  private alerts: Alert[] = [];
  private initialized: boolean = false;

  constructor(config: MonitoringConfig) {
    super();
    this.logger = new Logger('ModelMonitor');
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

  /**
   * Initialize the monitor
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.info('Monitor already initialized');
      return;
    }

    try {
      await fs.mkdir(this.config.storageDirectory, { recursive: true });
      this.initialized = true;
      this.logger.info('Initialized monitor');
    } catch (error) {
      this.logger.error('Failed to initialize monitor', error);
      throw new Error('Failed to initialize model monitor');
    }
  }

  /**
   * Record metrics
   */
  async recordMetrics(metrics: Record<string, number>): Promise<void> {
    if (!this.initialized) {
      throw new Error('Monitor not initialized');
    }

    if (!this.monitoring) {
      throw new Error('Monitor is not active');
    }

    try {
      const timestamp = new Date();
      const metricEntries = Object.entries(metrics).map(([name, value]) => ({
        name,
        value,
        timestamp,
        modelId: this.config.modelId
      }));

      this.metrics.push(...metricEntries);
      this.emit('metrics', metricEntries);

      // Check thresholds
      for (const [name, value] of Object.entries(metrics)) {
        const threshold = this.config.thresholds[name];
        if (threshold) {
          if (value >= threshold.critical) {
            this.createAlert('critical', name, value, threshold.critical);
          } else if (value >= threshold.warning) {
            this.createAlert('warning', name, value, threshold.warning);
          }
        }
      }

      await this.saveMetrics();
      this.logger.info('Recorded metrics');
    } catch (error) {
      this.logger.error('Failed to record metrics', error);
      throw new Error('Invalid metrics format');
    }
  }

  /**
   * Get metrics within a time range
   */
  async getMetricsInRange(startTime: number, endTime: number): Promise<MetricData[]> {
    if (!this.initialized) {
      throw new Error('Monitor not initialized');
    }

    return this.metrics.filter(m => {
      const timestamp = m.timestamp.getTime();
      return timestamp >= startTime && timestamp <= endTime;
    });
  }

  /**
   * Get all metrics
   */
  getMetrics(): MetricData[] {
    return [...this.metrics];
  }

  /**
   * Get all alerts
   */
  getAlerts(): Alert[] {
    return [...this.alerts];
  }

  /**
   * Start monitoring
   */
  async startMonitoring(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Monitor not initialized');
    }

    if (this.monitoring) {
      throw new Error('Monitoring is already active');
    }

    try {
      this.metrics = [];
      this.alerts = [];
      this.monitoring = true;
      this.intervalId = setInterval(() => {
        this.collectMetrics().catch(error => {
          this.logger.error('Failed to collect metrics:', error);
        });
      }, this.config.logInterval);
      this.logger.info('Started monitoring');
    } catch (error) {
      this.logger.error('Failed to start monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop monitoring
   */
  async stopMonitoring(): Promise<void> {
    if (!this.monitoring) {
      return;
    }

    try {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      this.monitoring = false;
      await this.saveMetrics();
      this.logger.info('Stopped monitoring');
    } catch (error) {
      this.logger.error('Failed to stop monitoring:', error);
      throw error;
    }
  }

  /**
   * Clean up old data
   */
  async cleanupOldMetrics(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Monitor not initialized');
    }

    try {
      const now = Date.now();
      const retentionPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days
      this.metrics = this.metrics.filter(m => (now - m.timestamp.getTime()) <= retentionPeriod);
      this.alerts = this.alerts.filter(a => (now - a.timestamp.getTime()) <= retentionPeriod);
      await this.saveMetrics();
      this.logger.info('Cleaned up old metrics');
    } catch (error) {
      this.logger.error('Failed to cleanup old metrics', error);
      throw error;
    }
  }

  /**
   * Update monitoring configuration
   */
  async updateConfig(config: Partial<MonitoringConfig>): Promise<void> {
    Object.assign(this.config, config);
    if (config.logInterval && this.monitoring) {
      this.updateMonitoringInterval(config.logInterval);
    }
  }

  /**
   * Check if monitoring is active
   */
  isMonitoring(): boolean {
    return this.monitoring;
  }

  private async saveMetrics(): Promise<void> {
    try {
      const filePath = path.join(this.config.storageDirectory, 'metrics.json');
      await fs.writeFile(filePath, JSON.stringify(this.metrics, null, 2));
    } catch (error) {
      this.logger.error('Failed to save metrics', error);
      throw error;
    }
  }

  private createAlert(type: 'warning' | 'critical', metric: string, value: number, threshold: number): void {
    const alert: Alert = {
      type,
      message: `${metric} exceeded ${type} threshold: ${value} >= ${threshold}`,
      metric,
      value,
      threshold,
      timestamp: new Date()
    };
    this.alerts.push(alert);
    this.emit('alert', alert);
    this.logger.warn(`Alert: ${alert.message}`);
  }

  private async collectMetrics(): Promise<void> {
    try {
      const metrics: Record<string, number> = {};
      for (const metric of this.config.metrics) {
        metrics[metric] = await this.getCurrentMetricValue(metric);
      }
      await this.recordMetrics(metrics);
    } catch (error) {
      this.logger.error('Failed to collect metrics', error);
    }
  }

  private async getCurrentMetricValue(metric: string): Promise<number> {
    // This is a placeholder implementation
    // In a real system, this would collect actual metrics from the model
    switch (metric) {
      case 'accuracy':
        return 0.95;
      case 'latency':
        return 100;
      case 'memoryUsage':
        return 50;
      case 'cpuUsage':
        return 30;
      case 'errorRate':
        return 0.05;
      case 'throughput':
        return 1000;
      default:
        return 0;
    }
  }

  private updateMonitoringInterval(interval: number): void {
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
          this.logger.error('Failed to collect metrics:', error);
        });
      }, interval);
    }
  }
} 