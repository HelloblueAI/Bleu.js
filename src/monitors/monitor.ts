import { EventEmitter } from 'events';
import { createLogger } from '../utils/logger.js';
import { ModelMonitor } from './modelMonitor';
import { MonitorConfig, MonitoringStats, ModelMetrics } from '../types/monitoring';
import { MonitorError } from '../errors/monitorError';
import { MetricsManager } from '../utils/metrics';
import { Storage } from '../storage/storage.js';
import { MonitoringError } from '../types/errors.js';
import { Logger } from '../utils/logger';
import { Metric, Alert } from '../types/monitor';

/**
 * Monitor class for managing multiple model monitors
 */
export class Monitor extends EventEmitter {
  private readonly logger = createLogger('Monitor');
  private readonly monitors: Map<string, ModelMonitor> = new Map();
  private readonly config: MonitorConfig;
  private readonly stats: MonitoringStats;
  private readonly metricsManager: MetricsManager;
  private readonly storage: Storage;
  private initialized: boolean = false;
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();
  private activeMonitors: Map<string, boolean>;

  constructor(storage: Storage, config: Partial<MonitorConfig> = {}, metricsManager: MetricsManager, logger: Logger) {
    super();
    this.config = {
      monitoringInterval: config.monitoringInterval || 60000,
      retentionPeriod: config.retentionPeriod || 7 * 24 * 60 * 60 * 1000,
      warningThreshold: config.warningThreshold || 0.8,
      criticalThreshold: config.criticalThreshold || 0.95
    };
    this.stats = {
      totalMonitors: 0,
      activeMonitors: 0,
      totalMetricsCollected: 0,
      alertsTriggered: 0
    };
    this.metricsManager = metricsManager;
    this.storage = storage;
    this.activeMonitors = new Map();
  }

  /**
   * Get the current monitor configuration
   * @returns The monitor configuration
   */
  getConfig(): MonitorConfig {
    return { ...this.config };
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
      await this.storage.initialize();
      this.initialized = true;
      this.logger.info('Initialized monitor');
    } catch (error) {
      this.logger.error('Failed to initialize monitor', error);
      throw new MonitoringError('Failed to initialize model monitor');
    }
  }

  /**
   * Clean up resources and stop all monitoring
   */
  async cleanup(): Promise<void> {
    if (!this.initialized) {
      this.logger.warn('Monitor not initialized, skipping cleanup');
      return;
    }

    try {
      // Stop all active monitors
      const stopPromises = Array.from(this.monitors.keys()).map(modelId => 
        this.stopMonitoring(modelId)
      );
      await Promise.all(stopPromises);

      // Clear all intervals
      this.monitoringIntervals.forEach(interval => clearInterval(interval));
      this.monitoringIntervals.clear();

      // Reset stats
      this.stats.activeMonitors = 0;
      this.stats.totalMetricsCollected = 0;
      this.stats.alertsTriggered = 0;

      // Clean up storage
      await this.storage.cleanup();
      
      this.initialized = false;
      this.logger.info('Monitor cleanup completed');
    } catch (error) {
      this.logger.error('Failed to cleanup monitor', error);
      throw new MonitoringError('Failed to cleanup monitor');
    }
  }

  /**
   * Start monitoring a model
   */
  async startMonitoring(modelId: string): Promise<void> {
    if (!this.initialized) {
      throw new MonitoringError('Monitor not initialized');
    }

    try {
      if (this.activeMonitors.has(modelId)) {
        this.logger.warn(`Monitor already active for model ${modelId}`);
        return;
      }

      await this.storage.initialize(modelId);
      await this.metricsManager.initialize(modelId);
      this.activeMonitors.set(modelId, true);
      this.logger.info(`Started monitoring for model ${modelId}`);
    } catch (error) {
      this.logger.error('Failed to start monitoring', { modelId, error });
      throw new MonitorError('MONITOR_START_FAILED', `Failed to start monitoring for model ${modelId}`);
    }
  }

  /**
   * Stop monitoring a model
   */
  async stopMonitoring(modelId: string): Promise<void> {
    if (!this.initialized) {
      throw new MonitoringError('Monitor not initialized');
    }

    try {
      if (!this.activeMonitors.has(modelId)) {
        throw new MonitorError('MONITOR_NOT_FOUND', `No active monitor found for model ${modelId}`);
      }

      await this.cleanup(modelId);
      this.activeMonitors.delete(modelId);
      this.logger.info(`Stopped monitoring for model ${modelId}`);
    } catch (error) {
      this.logger.error('Failed to stop monitoring', { modelId, error });
      throw error;
    }
  }

  /**
   * Record metrics for a model
   */
  async recordMetrics(modelId: string, metrics: Record<string, number>): Promise<void> {
    if (!this.initialized) {
      throw new MonitoringError('Monitor not initialized');
    }

    const monitor = this.monitors.get(modelId);
    if (!monitor) {
      throw new MonitorError('MONITOR_NOT_FOUND', `No monitor found for model ${modelId}`);
    }

    await monitor.recordMetrics(metrics);
    this.logger.info('Recorded metrics', { modelId });
  }

  /**
   * Get metrics for a model within a time range
   */
  async getMetricsInRange(modelId: string, startTime: number, endTime: number): Promise<any[]> {
    if (!this.initialized) {
      throw new MonitoringError('Monitor not initialized');
    }

    const monitor = this.monitors.get(modelId);
    if (!monitor) {
      throw new MonitorError('MONITOR_NOT_FOUND', `No monitor found for model ${modelId}`);
    }

    const metrics = monitor.getMetrics();
    return metrics.filter(m => m.timestamp >= startTime && m.timestamp <= endTime);
  }

  /**
   * Get alerts for a model
   */
  async getAlerts(modelId: string): Promise<any[]> {
    if (!this.initialized) {
      throw new MonitoringError('Monitor not initialized');
    }

    const monitor = this.monitors.get(modelId);
    if (!monitor) {
      throw new MonitorError('MONITOR_NOT_FOUND', `No monitor found for model ${modelId}`);
    }

    return monitor.getAlerts();
  }

  /**
   * Clean up old metrics
   */
  async cleanupOldMetrics(): Promise<void> {
    if (!this.initialized) {
      throw new MonitoringError('Monitor not initialized');
    }

    try {
      const now = Date.now();
      const cutoff = now - this.config.retentionPeriod;

      for (const monitor of this.monitors.values()) {
        const metrics = monitor.getMetrics();
        const newMetrics = metrics.filter(m => m.timestamp >= cutoff);
        if (newMetrics.length < metrics.length) {
          await monitor.cleanupOldData();
        }
      }

      this.logger.info('Cleaned up old metrics');
    } catch (error) {
      this.logger.error('Failed to clean up old metrics', error);
      throw new MonitoringError('Failed to clean up old metrics');
    }
  }

  async generateReport(modelId: string): Promise<string> {
    if (!this.initialized) {
      throw new MonitoringError('Monitor not initialized');
    }

    try {
      if (!this.activeMonitors.has(modelId)) {
        throw new MonitorError('MONITOR_NOT_FOUND', `No active monitor found for model ${modelId}`);
      }

      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - (24 * 60 * 60 * 1000)); // Last 24 hours
      const metrics = await this.getMetricsInRange(modelId, startTime.getTime(), endTime.getTime());
      const alerts = await this.getAlerts(modelId);

      const report = {
        modelId,
        timeRange: { startTime, endTime },
        metrics: metrics.length,
        alerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.level === 'critical').length,
        warningAlerts: alerts.filter(a => a.level === 'warning').length,
        averageMetricValue: metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length
      };

      return JSON.stringify(report, null, 2);
    } catch (error) {
      this.logger.error('Failed to generate report', { modelId, error });
      throw error;
    }
  }

  private summarizeMetrics(metrics: Metric[]): Record<string, { min: number; max: number; avg: number }> {
    const summary: Record<string, { min: number; max: number; sum: number; count: number }> = {};

    for (const metric of metrics) {
      if (!summary[metric.metricName]) {
        summary[metric.metricName] = {
          min: metric.value,
          max: metric.value,
          sum: metric.value,
          count: 1
        };
      } else {
        const s = summary[metric.metricName];
        s.min = Math.min(s.min, metric.value);
        s.max = Math.max(s.max, metric.value);
        s.sum += metric.value;
        s.count++;
      }
    }

    return Object.entries(summary).reduce((acc, [name, { min, max, sum, count }]) => {
      acc[name] = {
        min,
        max,
        avg: sum / count
      };
      return acc;
    }, {} as Record<string, { min: number; max: number; avg: number }>);
  }

  /**
   * Record a metric for a model
   * @param modelId - The ID of the model
   * @param metric - The metric to record
   */
  async recordMetric(modelId: string, metric: Metric): Promise<void> {
    if (!this.initialized) {
      throw new MonitoringError('Monitor not initialized');
    }

    try {
      if (!this.activeMonitors.has(modelId)) {
        throw new MonitorError('MONITOR_NOT_FOUND', `No active monitor found for model ${modelId}`);
      }

      await this.metricsManager.recordMetric(modelId, metric);

      // Check thresholds and create alerts if needed
      if (metric.value > this.config.criticalThreshold) {
        await this.createAlert(modelId, {
          type: 'CRITICAL',
          message: `Metric ${metric.name} exceeded critical threshold`,
          timestamp: new Date(),
          metric
        });
      } else if (metric.value > this.config.warningThreshold) {
        await this.createAlert(modelId, {
          type: 'WARNING',
          message: `Metric ${metric.name} exceeded warning threshold`,
          timestamp: new Date(),
          metric
        });
      }
    } catch (error) {
      this.logger.error('Failed to record metric', { modelId, metric, error });
      throw error;
    }
  }

  /**
   * Get metrics for a model
   * @param modelId - The ID of the model
   * @returns The model's metrics
   */
  async getMetrics(modelId: string): Promise<Metric[]> {
    if (!this.initialized) {
      throw new MonitoringError('Monitor not initialized');
    }

    const monitor = this.monitors.get(modelId);
    if (!monitor) {
      throw new MonitorError('MONITOR_NOT_FOUND', `No monitor found for model ${modelId}`);
    }
    return monitor.getMetrics();
  }

  /**
   * Generate an aggregate report for all monitored models
   * @returns The aggregate monitoring report
   */
  async generateAggregateReport(): Promise<any> {
    const reports = await Promise.all(
      Array.from(this.monitors.keys()).map(modelId => this.generateReport(modelId))
    );

    return {
      stats: this.stats,
      models: reports
    };
  }

  /**
   * Update monitoring configuration
   * @param modelId - The ID of the model
   * @param config - The new configuration
   */
  async updateConfig(modelId: string, config: Partial<MonitorConfig>): Promise<void> {
    const monitor = this.monitors.get(modelId);
    if (!monitor) {
      throw new MonitorError('MONITOR_NOT_FOUND', `No monitor found for model ${modelId}`);
    }
    await monitor.updateConfig(config);
  }

  /**
   * Check if a model is being monitored
   * @param modelId - The ID of the model
   * @returns True if the model is being monitored
   */
  isMonitoring(modelId: string): boolean {
    const monitor = this.monitors.get(modelId);
    return monitor ? monitor.isMonitoring() : false;
  }

  /**
   * Get list of monitored model IDs
   * @returns Array of monitored model IDs
   */
  getMonitoredModels(): string[] {
    return Array.from(this.monitors.keys());
  }

  private async createAlert(modelId: string, alert: Alert): Promise<void> {
    try {
      const alerts = await this.getAlerts(modelId);
      alerts.push(alert);
      await this.storage.save(`${modelId}_alerts`, alerts);
      this.logger.info('Created new alert', { modelId, alert });
    } catch (error) {
      this.logger.error('Failed to create alert', { modelId, alert, error });
      throw error;
    }
  }

  async cleanup(modelId: string): Promise<void> {
    try {
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - this.config.retentionPeriod);

      // Cleanup metrics
      const metrics = await this.getMetrics(modelId);
      await this.metricsManager.saveMetrics(modelId, metrics);

      // Cleanup alerts
      const alerts = (await this.getAlerts(modelId)).filter(
        alert => alert.timestamp > retentionDate
      );
      await this.storage.save(`${modelId}_alerts`, alerts);

      this.logger.info('Cleanup completed', { modelId });
    } catch (error) {
      this.logger.error('Failed to cleanup', { modelId, error });
      throw error;
    }
  }
} 