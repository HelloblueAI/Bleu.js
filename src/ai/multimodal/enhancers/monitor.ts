import * as fs from 'fs/promises';
import * as path from 'path';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('TestMonitor');

interface TestMetrics {
  passed: number;
  failed: number;
  duration: number;
}

interface TestReport {
  metrics: TestMetrics;
  timestamp: Date;
  status: 'success' | 'warning' | 'error';
}

interface MonitorConfig {
  metricsInterval?: number;
  retentionPeriod?: number;
  alertThresholds?: {
    error: number;
    warning: number;
  };
}

interface Metric {
  name: string;
  value: number;
  timestamp: number;
  labels: Record<string, string>;
}

interface Alert {
  id: string;
  severity: 'error' | 'warning';
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  labels: Record<string, string>;
}

interface MetricsSummary {
  count: number;
  min: number;
  max: number;
  avg: number;
  stdDev?: number;
}

export class Monitor {
  private config: Required<MonitorConfig>;
  private metrics: Metric[] = [];
  private alerts: Alert[] = [];
  private cleanupInterval: NodeJS.Timeout | null = null;
  private logger = createLogger('Monitor');
  private initialized = false;

  constructor(config?: MonitorConfig) {
    this.config = {
      metricsInterval: config?.metricsInterval ?? 5000,
      retentionPeriod: config?.retentionPeriod ?? 7 * 24 * 60 * 60 * 1000, // 7 days
      alertThresholds: config?.alertThresholds ?? {
        error: 0.1,
        warning: 0.05
      }
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.startCleanupInterval();
      this.initialized = true;
      this.logger.info('Monitor initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize monitor:', error);
      throw error;
    }
  }

  private startCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupOldData().catch(err => {
        this.logger.error('Error during metrics cleanup:', err);
      });
    }, this.config.metricsInterval);
  }

  async stop(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.initialized = false;
    this.logger.info('Monitor stopped');
  }

  private checkInitialized(): void {
    if (!this.initialized) {
      throw new Error('Monitor is not initialized. Call initialize() first.');
    }
  }

  async recordMetric(metric: Metric): Promise<void> {
    this.checkInitialized();

    try {
      this.metrics.push(metric);
      await this.checkThresholds(metric);
      this.logger.debug('Recorded metric:', metric);
    } catch (err) {
      this.logger.error('Error recording metric:', err);
      throw err;
    }
  }

  private async checkThresholds(metric: Metric): Promise<void> {
    const { error, warning } = this.config.alertThresholds;

    if (metric.value >= error) {
      await this.createAlert('error', metric, error);
    } else if (metric.value >= warning) {
      await this.createAlert('warning', metric, warning);
    }
  }

  private async createAlert(
    severity: 'error' | 'warning',
    metric: Metric,
    threshold: number
  ): Promise<void> {
    const alert: Alert = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      severity,
      metric: metric.name,
      value: metric.value,
      threshold,
      timestamp: Date.now(),
      labels: metric.labels
    };

    this.alerts.push(alert);
    this.logger.info(`Created ${severity} alert:`, alert);
  }

  async getMetrics(): Promise<Metric[]> {
    this.checkInitialized();
    return this.metrics;
  }

  async getMetricsInRange(startTime: number, endTime: number): Promise<Metric[]> {
    this.checkInitialized();
    return this.metrics.filter(
      metric => metric.timestamp >= startTime && metric.timestamp <= endTime
    );
  }

  async getAlerts(): Promise<Alert[]> {
    this.checkInitialized();
    return this.alerts;
  }

  async getMetricsSummary(metricName: string): Promise<MetricsSummary> {
    this.checkInitialized();
    const relevantMetrics = this.metrics.filter(m => m.name === metricName);
    
    if (relevantMetrics.length === 0) {
      return {
        count: 0,
        min: 0,
        max: 0,
        avg: 0
      };
    }

    const values = relevantMetrics.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;

    // Calculate standard deviation
    const squareDiffs = values.map(value => {
      const diff = value - avg;
      return diff * diff;
    });
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(avgSquareDiff);

    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg,
      stdDev
    };
  }

  async cleanupOldData(): Promise<void> {
    this.checkInitialized();
    const cutoffTime = Date.now() - this.config.retentionPeriod;
    
    this.metrics = this.metrics.filter(metric => metric.timestamp >= cutoffTime);
    this.alerts = this.alerts.filter(alert => alert.timestamp >= cutoffTime);
    
    this.logger.debug('Cleaned up old metrics and alerts');
  }

  getConfig(): Required<MonitorConfig> {
    return this.config;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
} 