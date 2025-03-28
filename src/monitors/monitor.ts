import { EventEmitter } from 'events';
import { createLogger } from '../utils/logger';
import { ModelMonitor } from '../monitoring/modelMonitor';
import * as path from 'path';
import * as fs from 'fs/promises';
import { z } from 'zod';

/**
 * Custom error class for Monitor-related errors
 */
export class MonitorError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'MonitorError';
  }
}

/**
 * Configuration schema for Monitor
 */
const MonitorConfigSchema = z.object({
  metrics: z.array(z.string()).optional(),
  thresholds: z.record(z.object({
    warning: z.number(),
    critical: z.number()
  })).optional(),
  storageDirectory: z.string().optional(),
  defaultInterval: z.number().min(1000).optional(),
  maxRetries: z.number().min(1).optional(),
  cleanupInterval: z.number().min(1000).optional(),
  maxStorageSize: z.number().min(1024 * 1024).optional(), // 1MB minimum
});

type MonitorConfig = z.infer<typeof MonitorConfigSchema>;

/**
 * Interface for metric data
 */
export interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

/**
 * Interface for alert data
 */
export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  message: string;
  timestamp: number;
  metric?: Metric;
}

/**
 * Interface for monitoring statistics
 */
export interface MonitoringStats {
  totalMetrics: number;
  totalAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  lastUpdate: number;
  uptime: number;
  memoryUsage: number;
}

/**
 * Main Monitor class for managing model monitoring
 */
export class Monitor extends EventEmitter {
  private readonly monitors: Map<string, ModelMonitor>;
  private readonly config: Required<MonitorConfig>;
  private readonly logger = createLogger('Monitor');
  private readonly stats: MonitoringStats;
  private cleanupInterval?: NodeJS.Timeout;
  private statsInterval?: NodeJS.Timeout;
  private isInitialized = false;
  private readonly metrics: Map<string, Metric[]>;
  private readonly alerts: Alert[];
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(config: MonitorConfig = {}) {
    super();
    
    // Validate and set configuration
    const validatedConfig = MonitorConfigSchema.parse(config);
    this.config = {
      metrics: validatedConfig.metrics ?? [],
      thresholds: validatedConfig.thresholds ?? {},
      storageDirectory: validatedConfig.storageDirectory ?? path.join(process.cwd(), 'monitoring'),
      defaultInterval: validatedConfig.defaultInterval ?? 60000,
      maxRetries: validatedConfig.maxRetries ?? 3,
      cleanupInterval: validatedConfig.cleanupInterval ?? 3600000, // 1 hour
      maxStorageSize: validatedConfig.maxStorageSize ?? 100 * 1024 * 1024 // 100MB
    };

    this.monitors = new Map();
    this.metrics = new Map();
    this.alerts = [];
    this.stats = {
      totalMetrics: 0,
      totalAlerts: 0,
      criticalAlerts: 0,
      warningAlerts: 0,
      lastUpdate: Date.now(),
      uptime: 0,
      memoryUsage: 0
    };
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
      throw new MonitorError('Monitor already initialized', 'ALREADY_INITIALIZED');
    }

    try {
      await this.setupStorageDirectory();
      
      // Setup cleanup interval
      this.cleanupInterval = setInterval(() => {
        this.cleanupOldData().catch(err => {
          this.logger.error('Cleanup failed:', err);
        });
      }, this.config.cleanupInterval);

      // Setup stats update interval
      this.statsInterval = setInterval(() => {
        this.updateStats();
      }, 60000); // Update stats every minute

      await this.loadMetrics();
      await this.loadAlerts();
      
      this.startMonitoring();
      this.isInitialized = true;
      this.logger.info('Monitor initialized successfully');
      this.emit('initialized');
    } catch (error) {
      this.logger.error('Failed to initialize monitor:', error);
      throw new MonitorError('Failed to initialize monitor', 'INIT_ERROR');
    }
  }

  /**
   * Setup storage directory
   */
  private async setupStorageDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.storageDirectory, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create storage directory:', error);
      throw new MonitorError('Failed to create storage directory', 'STORAGE_ERROR');
    }
  }

  /**
   * Start monitoring a model
   */
  async startMonitoring(modelId: string, config?: Partial<MonitorConfig>): Promise<void> {
    if (!this.isInitialized) {
      throw new MonitorError('Monitor not initialized', 'NOT_INITIALIZED');
    }

    try {
      if (this.monitors.has(modelId)) {
        this.logger.warn(`Monitor already exists for model ${modelId}`);
        return;
      }

      const monitor = new ModelMonitor({
        modelId,
        metrics: config?.metrics || [],
        logInterval: config?.interval || this.config.defaultInterval,
        thresholds: config?.thresholds || this.config.thresholds,
        alertingEnabled: config?.alerting !== false,
        storageDirectory: path.join(this.config.storageDirectory, modelId)
      });

      await monitor.start();
      this.monitors.set(modelId, monitor);
      this.logger.info(`Started monitoring for model ${modelId}`);
      this.emit('monitorStarted', { modelId });
    } catch (error) {
      this.logger.error(`Failed to start monitoring for model ${modelId}:`, error);
      throw new MonitorError(`Failed to start monitoring for model ${modelId}`, 'START_ERROR');
    }
  }

  /**
   * Stop monitoring a model
   */
  async stopMonitoring(modelId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new MonitorError('Monitor not initialized', 'NOT_INITIALIZED');
    }

    try {
      const monitor = this.monitors.get(modelId);
      if (!monitor) {
        this.logger.warn(`No monitor found for model ${modelId}`);
        return;
      }

      await monitor.stop();
      this.monitors.delete(modelId);
      this.logger.info(`Stopped monitoring for model ${modelId}`);
      this.emit('monitorStopped', { modelId });
    } catch (error) {
      this.logger.error(`Failed to stop monitoring for model ${modelId}:`, error);
      throw new MonitorError(`Failed to stop monitoring for model ${modelId}`, 'STOP_ERROR');
    }
  }

  /**
   * Record a metric
   */
  async recordMetric(name: string, value: number, metadata?: Record<string, unknown>): Promise<void> {
    if (!this.isInitialized) {
      throw new MonitorError('Monitor not initialized', 'NOT_INITIALIZED');
    }

    try {
      if (typeof value !== 'number' || isNaN(value)) {
        throw new MonitorError('Invalid metric value', 'INVALID_VALUE');
      }

      const metric: Metric = {
        name,
        value,
        timestamp: Date.now(),
        metadata
      };

      // Store metric in memory
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      this.metrics.get(name)!.push(metric);
      this.stats.totalMetrics++;
      this.emit('metricRecorded', metric);

      // Check thresholds
      await this.checkThresholds(metric);
    } catch (error) {
      this.logger.error(`Failed to record metric ${name}:`, error);
      if (error instanceof MonitorError) {
        throw error;
      }
      throw new MonitorError(`Failed to record metric ${name}`, 'RECORD_ERROR');
    }
  }

  /**
   * Get metrics
   */
  async getMetrics(name?: string, options?: { start?: number; end?: number }): Promise<Metric[]> {
    if (!this.isInitialized) {
      throw new MonitorError('Monitor not initialized', 'NOT_INITIALIZED');
    }

    try {
      if (!name) {
        return Array.from(this.metrics.values()).flat();
      }

      const metrics = this.metrics.get(name) || [];
      if (!options) {
        return metrics;
      }

      return metrics.filter(m => {
        if (options.start && m.timestamp < options.start) return false;
        if (options.end && m.timestamp > options.end) return false;
        return true;
      });
    } catch (error) {
      this.logger.error('Failed to get metrics:', error);
      throw new MonitorError('Failed to get metrics', 'GET_METRICS_ERROR');
    }
  }

  /**
   * Check thresholds
   */
  private async checkThresholds(metric: Metric): Promise<void> {
    const thresholds = this.config.thresholds[metric.name];
    if (!thresholds) return;

    if (metric.value >= thresholds.critical) {
      await this.createAlert('critical', `Critical threshold exceeded for ${metric.name}`, metric);
    } else if (metric.value >= thresholds.warning) {
      await this.createAlert('warning', `Warning threshold exceeded for ${metric.name}`, metric);
    }
  }

  /**
   * Create an alert
   */
  private async createAlert(type: Alert['type'], message: string, metric?: Metric): Promise<void> {
    if (!this.isInitialized) {
      throw new MonitorError('Monitor not initialized', 'NOT_INITIALIZED');
    }

    try {
      const alert: Alert = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        message,
        timestamp: Date.now(),
        metric
      };

      this.alerts.push(alert);
      this.stats.totalAlerts++;
      if (type === 'critical') {
        this.stats.criticalAlerts++;
      } else {
        this.stats.warningAlerts++;
      }

      this.emit('alertCreated', alert);
    } catch (error) {
      this.logger.error('Failed to create alert:', error);
      throw new MonitorError('Failed to create alert', 'ALERT_ERROR');
    }
  }

  /**
   * Get alerts
   */
  async getAlerts(options?: { start?: number; end?: number }): Promise<Alert[]> {
    if (!this.isInitialized) {
      throw new MonitorError('Monitor not initialized', 'NOT_INITIALIZED');
    }

    try {
      if (!options) {
        return this.alerts;
      }

      return this.alerts.filter(a => {
        if (options.start && a.timestamp < options.start) return false;
        if (options.end && a.timestamp > options.end) return false;
        return true;
      });
    } catch (error) {
      this.logger.error('Failed to get alerts:', error);
      throw new MonitorError('Failed to get alerts', 'GET_ALERTS_ERROR');
    }
  }

  /**
   * Generate a report for a model
   */
  async generateReport(modelId: string): Promise<{
    modelId: string;
    status: string;
    metrics: Metric[];
    alerts: { critical: number; warning: number };
    lastUpdated: string;
  }> {
    if (!this.isInitialized) {
      throw new MonitorError('Monitor not initialized', 'NOT_INITIALIZED');
    }

    const monitor = this.monitors.get(modelId);
    if (!monitor) {
      throw new MonitorError(`No monitor found for model ${modelId}`, 'MONITOR_NOT_FOUND');
    }

    try {
      const metrics = await monitor.getMetrics();
      const alerts = await monitor.getAlerts();

      return {
        modelId,
        status: 'active',
        metrics,
        alerts: {
          critical: alerts.filter(a => a.type === 'critical').length,
          warning: alerts.filter(a => a.type === 'warning').length
        },
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to generate report for model ${modelId}:`, error);
      throw new MonitorError(`Failed to generate report for model ${modelId}`, 'REPORT_ERROR');
    }
  }

  /**
   * Generate an aggregate report for all models
   */
  async generateAggregateReport(): Promise<{
    timestamp: string;
    summary: {
      totalModels: number;
      totalMetrics: number;
      totalAlerts: number;
      criticalAlerts: number;
      status: string;
      lastUpdated: string;
    };
    models: Record<string, unknown>;
  }> {
    if (!this.isInitialized) {
      throw new MonitorError('Monitor not initialized', 'NOT_INITIALIZED');
    }

    try {
      const timestamp = new Date().toISOString();
      const modelReports: Record<string, unknown> = {};
      let totalMetrics = 0;
      let totalAlerts = 0;
      let criticalAlerts = 0;

      for (const [modelId, monitor] of this.monitors) {
        const report = await this.generateReport(modelId);
        modelReports[modelId] = report;
        totalMetrics += report.metrics.length;
        totalAlerts += report.alerts.filter(a => a.type === 'critical').length + report.alerts.filter(a => a.type === 'warning').length;
        criticalAlerts += report.alerts.filter(a => a.type === 'critical').length;
      }

      return {
        timestamp,
        summary: {
          totalModels: this.monitors.size,
          totalMetrics,
          totalAlerts,
          criticalAlerts,
          status: criticalAlerts > 0 ? 'critical' : totalAlerts > 0 ? 'warning' : 'healthy',
          lastUpdated: timestamp
        },
        models: modelReports
      };
    } catch (error) {
      this.logger.error('Failed to generate aggregate report:', error);
      throw new MonitorError('Failed to generate aggregate report', 'AGGREGATE_REPORT_ERROR');
    }
  }

  /**
   * Check if a model is being monitored
   */
  isMonitoring(modelId: string): boolean {
    return this.monitors.has(modelId);
  }

  /**
   * Get list of monitored models
   */
  getMonitoredModels(): string[] {
    return Array.from(this.monitors.keys());
  }

  /**
   * Update thresholds for a model
   */
  async updateThresholds(modelId: string, thresholds: Record<string, { warning: number; critical: number }>): Promise<void> {
    if (!this.isInitialized) {
      throw new MonitorError('Monitor not initialized', 'NOT_INITIALIZED');
    }

    const monitor = this.monitors.get(modelId);
    if (!monitor) {
      throw new MonitorError(`No monitor found for model ${modelId}`, 'MONITOR_NOT_FOUND');
    }

    try {
      await monitor.updateThresholds(thresholds);
      this.emit('thresholdsUpdated', { modelId, thresholds });
    } catch (error) {
      this.logger.error(`Failed to update thresholds for model ${modelId}:`, error);
      throw new MonitorError(`Failed to update thresholds for model ${modelId}`, 'UPDATE_THRESHOLDS_ERROR');
    }
  }

  /**
   * Update monitoring interval for a model
   */
  async updateMonitoringInterval(modelId: string, interval: number): Promise<void> {
    if (!this.isInitialized) {
      throw new MonitorError('Monitor not initialized', 'NOT_INITIALIZED');
    }

    const monitor = this.monitors.get(modelId);
    if (!monitor) {
      throw new MonitorError(`No monitor found for model ${modelId}`, 'MONITOR_NOT_FOUND');
    }

    try {
      await monitor.updateMonitoringInterval(interval);
      this.emit('intervalUpdated', { modelId, interval });
    } catch (error) {
      this.logger.error(`Failed to update monitoring interval for model ${modelId}:`, error);
      throw new MonitorError(`Failed to update monitoring interval for model ${modelId}`, 'UPDATE_INTERVAL_ERROR');
    }
  }

  /**
   * Toggle alerting for a model
   */
  async toggleAlerting(modelId: string, enabled: boolean): Promise<void> {
    if (!this.isInitialized) {
      throw new MonitorError('Monitor not initialized', 'NOT_INITIALIZED');
    }

    const monitor = this.monitors.get(modelId);
    if (!monitor) {
      throw new MonitorError(`No monitor found for model ${modelId}`, 'MONITOR_NOT_FOUND');
    }

    try {
      await monitor.toggleAlerting(enabled);
      this.emit('alertingToggled', { modelId, enabled });
    } catch (error) {
      this.logger.error(`Failed to toggle alerting for model ${modelId}:`, error);
      throw new MonitorError(`Failed to toggle alerting for model ${modelId}`, 'TOGGLE_ALERTING_ERROR');
    }
  }

  /**
   * Clean up old data
   */
  async cleanupOldData(maxAge?: number): Promise<void> {
    if (!this.isInitialized) {
      throw new MonitorError('Monitor not initialized', 'NOT_INITIALIZED');
    }

    try {
      const now = Date.now();
      const age = maxAge || 24 * 60 * 60 * 1000; // Default to 24 hours

      // Clean up metrics
      for (const [name, metrics] of this.metrics.entries()) {
        const filteredMetrics = metrics.filter(m => now - m.timestamp <= age);
        if (filteredMetrics.length !== metrics.length) {
          this.metrics.set(name, filteredMetrics);
        }
      }

      // Clean up alerts
      const alertIndex = this.alerts.findIndex(a => now - a.timestamp > age);
      if (alertIndex !== -1) {
        this.alerts.splice(0, alertIndex + 1);
      }

      this.emit('cleanupCompleted', { maxAge });
    } catch (error) {
      this.logger.error('Failed to clean up old data:', error);
      throw new MonitorError('Failed to clean up old data', 'CLEANUP_ERROR');
    }
  }

  /**
   * Update monitoring statistics
   */
  private updateStats(): void {
    this.stats.uptime = Date.now() - this.stats.lastUpdate;
    this.stats.memoryUsage = process.memoryUsage().heapUsed;
    this.stats.lastUpdate = Date.now();
  }

  /**
   * Get monitoring statistics
   */
  getStats(): MonitoringStats {
    return { ...this.stats };
  }

  /**
   * Dispose of resources
   */
  async dispose(): Promise<void> {
    try {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = undefined;
      }
      if (this.statsInterval) {
        clearInterval(this.statsInterval);
        this.statsInterval = undefined;
      }
      for (const [modelId, monitor] of this.monitors) {
        await monitor.stop();
        this.monitors.delete(modelId);
      }
      this.metrics.clear();
      this.alerts.length = 0;
      this.isInitialized = false;
      this.emit('disposed');
    } catch (error) {
      this.logger.error('Failed to dispose monitor:', error);
      throw new MonitorError('Failed to dispose monitor', 'DISPOSE_ERROR');
    }
  }

  private startMonitoring(): void {
    this.checkInterval = setInterval(async () => {
      try {
        await this.cleanupOldData();
      } catch (error) {
        this.logger.error('Failed to perform monitoring check:', error);
      }
    }, this.config.cleanupInterval);
  }

  private async loadMetrics(): Promise<void> {
    try {
      const metricsPath = path.join(this.config.storageDirectory, 'metrics.json');
      const data = await fs.readFile(metricsPath, 'utf-8');
      this.metrics = new Map(JSON.parse(data).map(([name, metrics]: [string, Metric[]]) => [name, metrics]));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.error('Failed to load metrics:', error);
      }
    }
  }

  private async loadAlerts(): Promise<void> {
    try {
      const alertsPath = path.join(this.config.storageDirectory, 'alerts.json');
      const data = await fs.readFile(alertsPath, 'utf-8');
      this.alerts = JSON.parse(data);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.error('Failed to load alerts:', error);
      }
    }
  }

  private async saveMetrics(): Promise<void> {
    try {
      const metricsPath = path.join(this.config.storageDirectory, 'metrics.json');
      await fs.writeFile(metricsPath, JSON.stringify(Array.from(this.metrics.entries()).map(([name, metrics]) => [name, metrics])));
    } catch (error) {
      this.logger.error('Failed to save metrics:', error);
      throw new MonitorError('Failed to save metrics', 'SAVE_ERROR');
    }
  }

  private async saveAlerts(): Promise<void> {
    try {
      const alertsPath = path.join(this.config.storageDirectory, 'alerts.json');
      await fs.writeFile(alertsPath, JSON.stringify(this.alerts));
    } catch (error) {
      this.logger.error('Failed to save alerts:', error);
      throw new MonitorError('Failed to save alerts', 'SAVE_ERROR');
    }
  }
} 