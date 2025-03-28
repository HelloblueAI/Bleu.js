import { createLogger } from '../utils/logger';
import * as path from 'path';
import * as fs from 'fs/promises';
import { EventEmitter } from 'events';

export interface ModelMonitorConfig {
  modelId: string;
  metrics?: string[];
  logInterval?: number;
  thresholds?: Record<string, { warning: number; critical: number }>;
  alertingEnabled?: boolean;
  storageDirectory?: string;
}

export interface Metric {
  timestamp: number;
  value: number;
  metadata?: Record<string, unknown>;
}

export interface Alert {
  timestamp: number;
  type: 'warning' | 'critical';
  message: string;
  metadata?: Record<string, unknown>;
}

export class ModelMonitor extends EventEmitter {
  private readonly logger = createLogger('ModelMonitor');
  private readonly config: Required<ModelMonitorConfig>;
  private readonly metrics: Metric[];
  private readonly alerts: Alert[];
  private monitoringInterval?: NodeJS.Timeout;
  private isInitialized = false;

  constructor(config: ModelMonitorConfig) {
    super();
    
    this.config = {
      modelId: config.modelId,
      metrics: config.metrics || [],
      logInterval: config.logInterval || 60000,
      thresholds: config.thresholds || {},
      alertingEnabled: config.alertingEnabled !== false,
      storageDirectory: config.storageDirectory || path.join(process.cwd(), 'monitoring', config.modelId)
    };

    this.metrics = [];
    this.alerts = [];
  }

  /**
   * Check if the monitor is initialized
   */
  isInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Initialize the monitor
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('Monitor already initialized');
    }

    try {
      await fs.mkdir(this.config.storageDirectory, { recursive: true });
      this.isInitialized = true;
      this.logger.info(`Initialized monitor for model ${this.config.modelId}`);
    } catch (error) {
      this.logger.error(`Failed to initialize monitor for model ${this.config.modelId}:`, error);
      throw error;
    }
  }

  /**
   * Start monitoring
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      this.monitoringInterval = setInterval(() => {
        this.collectMetrics().catch(err => {
          this.logger.error('Failed to collect metrics:', err);
        });
      }, this.config.logInterval);

      this.logger.info(`Started monitoring for model ${this.config.modelId}`);
      this.emit('started');
    } catch (error) {
      this.logger.error(`Failed to start monitoring for model ${this.config.modelId}:`, error);
      throw error;
    }
  }

  /**
   * Stop monitoring
   */
  async stop(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.logger.info(`Stopped monitoring for model ${this.config.modelId}`);
    this.emit('stopped');
  }

  /**
   * Record a metric
   */
  async recordMetric(name: string, value: number, metadata?: Record<string, unknown>): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Monitor not initialized');
    }

    if (!this.config.metrics.includes(name)) {
      throw new Error('Invalid metric name');
    }

    const metric: Metric = {
      timestamp: Date.now(),
      value,
      metadata
    };

    this.metrics.push(metric);
    await this.checkThresholds(name, value);
    await this.persistMetrics();
  }

  /**
   * Get metrics within time range
   */
  getMetrics(start?: number, end?: number): Metric[] {
    return this.metrics.filter(metric => {
      if (start && metric.timestamp < start) return false;
      if (end && metric.timestamp > end) return false;
      return true;
    });
  }

  /**
   * Get alerts within time range
   */
  getAlerts(start?: number, end?: number): Alert[] {
    return this.alerts.filter(alert => {
      if (start && alert.timestamp < start) return false;
      if (end && alert.timestamp > end) return false;
      return true;
    });
  }

  /**
   * Get latest metrics
   */
  getLatestMetrics(count: number = 10): Metric[] {
    return this.metrics.slice(-count);
  }

  /**
   * Get latest alerts
   */
  getLatestAlerts(count: number = 10): Alert[] {
    return this.alerts.slice(-count);
  }

  /**
   * Clean up old data
   */
  async cleanupOldData(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    const cutoff = Date.now() - maxAge;
    this.metrics.splice(0, this.metrics.findIndex(m => m.timestamp >= cutoff));
    this.alerts.splice(0, this.alerts.findIndex(a => a.timestamp >= cutoff));
    await this.persistMetrics();
    await this.persistAlerts();
  }

  private async collectMetrics(): Promise<void> {
    // Implementation for collecting metrics
    // This should be implemented based on the specific model being monitored
  }

  private async checkThresholds(name: string, value: number): Promise<void> {
    const threshold = this.config.thresholds[name];
    if (!threshold) return;

    if (value <= threshold.critical) {
      await this.createAlert('critical', `${name} threshold breached: ${value}`);
    } else if (value <= threshold.warning) {
      await this.createAlert('warning', `${name} threshold breached: ${value}`);
    }
  }

  private async createAlert(type: 'warning' | 'critical', message: string, metadata?: Record<string, unknown>): Promise<void> {
    if (!this.config.alertingEnabled) return;

    const alert: Alert = {
      timestamp: Date.now(),
      type,
      message,
      metadata
    };

    this.alerts.push(alert);
    await this.persistAlerts();
    this.emit('alert', alert);
  }

  private async persistMetrics(): Promise<void> {
    try {
      await fs.writeFile(
        path.join(this.config.storageDirectory, 'metrics.json'),
        JSON.stringify(this.metrics)
      );
    } catch (error) {
      this.logger.error('Failed to persist metrics:', error);
      throw error;
    }
  }

  private async persistAlerts(): Promise<void> {
    try {
      await fs.writeFile(
        path.join(this.config.storageDirectory, 'alerts.json'),
        JSON.stringify(this.alerts)
      );
    } catch (error) {
      this.logger.error('Failed to persist alerts:', error);
      throw error;
    }
  }
}