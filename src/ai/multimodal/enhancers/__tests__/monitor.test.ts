import { Monitor } from '../monitor';
import { Storage } from '../../../../storage/storage';
import { Logger } from '../../../../utils/logger';
import { Metric } from '../../../../types/monitor';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';

describe('Monitor', () => {
  let monitor: Monitor;
  let storage: Storage;
  let logger: Logger;
  let testDir: string;

  beforeEach(async () => {
    logger = new Logger('MonitorTest');
    testDir = path.join(os.tmpdir(), `monitor-test-${Date.now()}`);
    
    storage = new Storage({
      path: testDir,
      retentionDays: 7,
      compression: false
    }, logger);
    
    await storage.initialize();
    
    monitor = new Monitor(storage, logger, {
      interval: 1000,
      retentionDays: 7,
      alertThresholds: {
        warning: 0.8,
        critical: 0.95
      }
    });
    
    await monitor.initialize();
  });

  afterEach(async () => {
    await monitor.cleanup();
    await storage.cleanup();
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('initialize', () => {
    it('should initialize the monitor successfully', async () => {
      expect(monitor).toBeDefined();
      // Verify initialization by checking if we can record metrics
      const metric: Metric = {
        name: 'test_metric',
        value: 0.5,
        unit: 'percentage'
      };
      await monitor.recordMetrics(metric);
      const metrics = await monitor.getMetricsInRange(
        new Date(Date.now() - 1000),
        new Date()
      );
      expect(metrics).toBeDefined();
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should handle initialization failure', async () => {
      const invalidStorage = new Storage({
        path: '/invalid/path/that/should/fail',
        retentionDays: 7,
        compression: false
      }, logger);
      
      const invalidMonitor = new Monitor(invalidStorage, logger, {
        interval: 1000,
        retentionDays: 7,
        alertThresholds: {
          warning: 0.8,
          critical: 0.95
        }
      });
      
      await expect(invalidMonitor.initialize()).rejects.toThrow('Failed to initialize monitor');
    });
  });

  describe('recordMetrics', () => {
    const testMetric: Metric = {
      name: 'test_metric',
      value: 0.5,
      unit: 'percentage'
    };

    it('should record metrics successfully', async () => {
      await monitor.recordMetrics(testMetric);
      const metrics = await monitor.getMetricsInRange(
        new Date(Date.now() - 1000),
        new Date()
      );
      expect(metrics).toBeDefined();
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].name).toBe(testMetric.name);
      expect(metrics[0].value).toBe(testMetric.value);
    });

    it('should generate warning alert when threshold exceeded', async () => {
      const warningMetric: Metric = {
        ...testMetric,
        value: 0.85
      };

      await monitor.recordMetrics(warningMetric);
      const alerts = await monitor.getAlerts();
      expect(alerts).toBeDefined();
      expect(alerts.some(alert => alert.level === 'warning')).toBe(true);
    });

    it('should generate critical alert when threshold exceeded', async () => {
      const criticalMetric: Metric = {
        ...testMetric,
        value: 0.96
      };

      await monitor.recordMetrics(criticalMetric);
      const alerts = await monitor.getAlerts();
      expect(alerts).toBeDefined();
      expect(alerts.some(alert => alert.level === 'critical')).toBe(true);
    });

    it('should handle recording failure', async () => {
      // Force a recording failure by making the storage read-only
      await fs.chmod(testDir, 0o444);
      await expect(monitor.recordMetrics(testMetric)).rejects.toThrow('Failed to record metrics');
    });
  });

  describe('cleanupOldMetrics', () => {
    it('should cleanup old metrics successfully', async () => {
      // Record some metrics
      const oldMetric: Metric = {
        name: 'old_metric',
        value: 0.5,
        unit: 'percentage',
        timestamp: Date.now() - (8 * 24 * 60 * 60 * 1000) // 8 days old
      };
      
      const recentMetric: Metric = {
        name: 'recent_metric',
        value: 0.5,
        unit: 'percentage',
        timestamp: Date.now() - (3 * 24 * 60 * 60 * 1000) // 3 days old
      };
      
      await monitor.recordMetrics(oldMetric);
      await monitor.recordMetrics(recentMetric);

      await monitor.cleanupOldMetrics();
      
      const metrics = await monitor.getMetricsInRange(
        new Date(Date.now() - 1000),
        new Date()
      );
      expect(metrics).toBeDefined();
      expect(metrics.length).toBe(1);
      expect(metrics[0].name).toBe('recent_metric');
    });

    it('should handle cleanup failure', async () => {
      // Force a cleanup failure by making the storage inaccessible
      await fs.chmod(testDir, 0o000);
      await expect(monitor.cleanupOldMetrics()).rejects.toThrow('Failed to cleanup old metrics');
    });
  });

  describe('getMetricsInRange', () => {
    it('should retrieve metrics within time range', async () => {
      const startTime = new Date();
      startTime.setDate(startTime.getDate() - 1);
      const endTime = new Date();

      // Record some metrics
      const metric: Metric = {
        name: 'test_metric',
        value: 0.5,
        unit: 'percentage'
      };
      await monitor.recordMetrics(metric);

      const metrics = await monitor.getMetricsInRange(startTime, endTime);
      expect(metrics).toBeDefined();
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].name).toBe(metric.name);
      expect(metrics[0].value).toBe(metric.value);
    });

    it('should handle retrieval failure', async () => {
      // Force a retrieval failure by making the storage inaccessible
      await fs.chmod(testDir, 0o000);
      await expect(monitor.getMetricsInRange(
        new Date(Date.now() - 1000),
        new Date()
      )).rejects.toThrow('Failed to retrieve metrics');
    });
  });
}); 