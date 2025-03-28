import { jest } from '@jest/globals';
import { Monitor } from '../monitor';
import { createLogger } from '../../../../utils/logger';

// Mock the logger
jest.mock('../../../../utils/logger', () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })
}));

describe('Monitor', () => {
  let monitor: Monitor;

  beforeEach(async () => {
    monitor = new Monitor({
      metricsInterval: 1000,
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      alertThresholds: {
        error: 0.1,
        warning: 0.05
      }
    });
    await monitor.initialize();
  });

  afterEach(async () => {
    await monitor.stop();
  });

  describe('Initialization', () => {
    it('should initialize with default config', async () => {
      const defaultMonitor = new Monitor();
      await defaultMonitor.initialize();
      expect(defaultMonitor.isInitialized()).toBe(true);
      expect(defaultMonitor.getConfig()).toBeDefined();
      await defaultMonitor.stop();
    });

    it('should initialize with custom config', () => {
      expect(monitor.getConfig().metricsInterval).toBe(1000);
      expect(monitor.getConfig().retentionPeriod).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe('Metrics Collection', () => {
    it('should record metrics', async () => {
      const metric = {
        name: 'test_metric',
        value: 0.95,
        timestamp: Date.now(),
        labels: { model: 'test' }
      };

      await monitor.recordMetric(metric);
      const metrics = await monitor.getMetrics();
      expect(metrics).toContainEqual(expect.objectContaining(metric));
    });

    it('should aggregate metrics', async () => {
      const metrics = [
        { name: 'test_metric', value: 0.9, timestamp: Date.now(), labels: { model: 'test' } },
        { name: 'test_metric', value: 0.8, timestamp: Date.now(), labels: { model: 'test' } }
      ];

      for (const metric of metrics) {
        await monitor.recordMetric(metric);
      }

      const summary = await monitor.getMetricsSummary('test_metric');
      expect(summary).toEqual(expect.objectContaining({
        count: 2,
        min: 0.8,
        max: 0.9,
        avg: 0.85
      }));
    });
  });

  describe('Alert System', () => {
    it('should generate alert for error threshold breach', async () => {
      const metric = {
        name: 'error_rate',
        value: 0.15, // Above error threshold
        timestamp: Date.now(),
        labels: { model: 'test' }
      };

      await monitor.recordMetric(metric);
      const alerts = await monitor.getAlerts();
      expect(alerts).toContainEqual(expect.objectContaining({
        severity: 'error',
        metric: metric.name
      }));
    });

    it('should generate alert for warning threshold breach', async () => {
      const metric = {
        name: 'error_rate',
        value: 0.07, // Above warning threshold
        timestamp: Date.now(),
        labels: { model: 'test' }
      };

      await monitor.recordMetric(metric);
      const alerts = await monitor.getAlerts();
      expect(alerts).toContainEqual(expect.objectContaining({
        severity: 'warning',
        metric: metric.name
      }));
    });
  });

  describe('Data Management', () => {
    it('should clean up old metrics', async () => {
      const oldMetric = {
        name: 'old_metric',
        value: 0.5,
        timestamp: Date.now() - 48 * 60 * 60 * 1000, // 48 hours ago
        labels: { model: 'test' }
      };

      await monitor.recordMetric(oldMetric);
      await monitor.cleanupOldData();
      const metrics = await monitor.getMetrics();
      expect(metrics).not.toContainEqual(expect.objectContaining(oldMetric));
    });

    it('should retrieve metrics within time range', async () => {
      const now = Date.now();
      const metrics = [
        { name: 'test_metric', value: 0.9, timestamp: now - 1000, labels: { model: 'test' } },
        { name: 'test_metric', value: 0.8, timestamp: now - 2000, labels: { model: 'test' } }
      ];

      for (const metric of metrics) {
        await monitor.recordMetric(metric);
      }

      const rangeMetrics = await monitor.getMetricsInRange(now - 1500, now);
      expect(rangeMetrics).toHaveLength(1);
      expect(rangeMetrics[0].value).toBe(0.9);
    });
  });

  describe('Performance', () => {
    it('should handle high frequency metric recording', async () => {
      const promises = [];
      for (let i = 0; i < 1000; i++) {
        promises.push(monitor.recordMetric({
          name: 'perf_test',
          value: Math.random(),
          timestamp: Date.now(),
          labels: { model: 'test' }
        }));
      }

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });

    it('should maintain performance during cleanup', async () => {
      // Record some metrics
      for (let i = 0; i < 100; i++) {
        await monitor.recordMetric({
          name: 'cleanup_test',
          value: Math.random(),
          timestamp: Date.now() - Math.random() * 48 * 60 * 60 * 1000,
          labels: { model: 'test' }
        });
      }

      const startTime = Date.now();
      await monitor.cleanupOldData();
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
}); 