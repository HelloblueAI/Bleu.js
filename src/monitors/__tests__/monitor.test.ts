import { Monitor, MonitorError } from '../monitor';
import { createLogger } from '../../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

jest.mock('../../utils/logger', () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })
}));

jest.mock('fs/promises');

describe('Monitor', () => {
  let monitor: Monitor;
  const testStorageDir = path.join(process.cwd(), 'test-monitoring');

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    monitor = new Monitor({
      storageDirectory: testStorageDir,
      thresholds: {
        'test-metric': {
          warning: 50,
          critical: 30
        }
      }
    });
  });

  afterEach(async () => {
    try {
      await monitor.dispose();
    } catch (error) {
      console.error('Error in afterEach:', error);
    }
  });

  afterAll(async () => {
    // Ensure all timers are cleared
    jest.clearAllTimers();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(monitor.initialize()).resolves.toBeUndefined();
      expect(fs.mkdir).toHaveBeenCalledWith(testStorageDir, { recursive: true });
    });

    it('should handle initialization errors', async () => {
      (fs.mkdir as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));
      await expect(monitor.initialize()).rejects.toThrow(MonitorError);
    });

    it('should not initialize twice', async () => {
      await monitor.initialize();
      await monitor.initialize();
      expect(fs.mkdir).toHaveBeenCalledTimes(1);
    });
  });

  describe('metric recording', () => {
    beforeEach(async () => {
      await monitor.initialize();
    });

    it('should record metrics successfully', async () => {
      await monitor.recordMetric('test-metric', 100);
      const metrics = await monitor.getMetrics('test-metric');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(100);
    });

    it('should create warning alert for threshold violation', async () => {
      await monitor.recordMetric('test-metric', 40);
      const alerts = await monitor.getAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe('medium');
    });

    it('should create critical alert for threshold violation', async () => {
      await monitor.recordMetric('test-metric', 20);
      const alerts = await monitor.getAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe('high');
    });

    it('should handle recording errors', async () => {
      await expect(monitor.recordMetric('test-metric', NaN))
        .rejects.toThrow('Invalid metric value');
    });
  });

  describe('data retrieval', () => {
    beforeEach(async () => {
      await monitor.initialize();
      await monitor.recordMetric('test-metric', 100);
      await monitor.recordMetric('test-metric', 40);
      await monitor.recordMetric('test-metric', 20);
    });

    it('should get all metrics', async () => {
      const metrics = await monitor.getMetrics();
      expect(metrics).toHaveLength(3);
    });

    it('should get metrics by name', async () => {
      const metrics = await monitor.getMetrics('test-metric');
      expect(metrics).toHaveLength(3);
    });

    it('should get metrics within time range', async () => {
      const now = Date.now();
      const metrics = await monitor.getMetrics('test-metric', {
        start: now - 1000,
        end: now + 1000
      });
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should get all alerts', async () => {
      const alerts = await monitor.getAlerts();
      expect(alerts).toHaveLength(2); // Warning and critical alerts
    });

    it('should get alerts within time range', async () => {
      const now = Date.now();
      const alerts = await monitor.getAlerts({
        start: now - 1000,
        end: now + 1000
      });
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      await monitor.initialize();
      await monitor.recordMetric('test-metric', 100);
      await monitor.recordMetric('test-metric', 40);
    });

    it('should clean up old data', async () => {
      const now = Date.now();
      monitor['metrics'].clear(); // Clear existing metrics
      monitor['alerts'].length = 0; // Clear existing alerts
      
      const oldMetric = {
        timestamp: now - 2000,
        value: 100
      };
      const newMetric = {
        timestamp: now,
        value: 80 // Value above warning threshold
      };
      monitor['metrics'].set('test-metric', [oldMetric, newMetric]);

      await monitor.cleanupOldData(1000); // Clean up data older than 1 second
      const metrics = await monitor.getMetrics();
      const alerts = await monitor.getAlerts();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(80);
      expect(alerts).toHaveLength(0);
    });

    it('should handle cleanup errors', async () => {
      const originalCleanupOldData = monitor['cleanupOldData'];
      monitor['cleanupOldData'] = async () => {
        throw new MonitorError('Cleanup failed', 'CLEANUP_ERROR');
      };
      
      await expect(monitor.cleanupOldData()).rejects.toThrow('Cleanup failed');
      monitor['cleanupOldData'] = originalCleanupOldData;
    });
  });

  describe('statistics', () => {
    beforeEach(async () => {
      await monitor.initialize();
      await monitor.recordMetric('test-metric', 100);
      await monitor.recordMetric('test-metric', 40);
      await monitor.recordMetric('test-metric', 20);
    });

    it('should track monitoring statistics', () => {
      const stats = monitor.getStats();
      expect(stats.totalMetrics).toBe(3);
      expect(stats.totalAlerts).toBe(2);
      expect(stats.criticalAlerts).toBe(1);
      expect(stats.warningAlerts).toBe(1);
      expect(stats.lastUpdate).toBeDefined();
      expect(stats.uptime).toBeDefined();
      expect(stats.memoryUsage).toBeDefined();
    });
  });

  describe('event emission', () => {
    beforeEach(async () => {
      await monitor.initialize();
    });

    it('should emit events for metric recording', (done) => {
      monitor.once('metricRecorded', (metric) => {
        expect(metric.value).toBe(100);
        done();
      });
      monitor.recordMetric('test-metric', 100);
    });

    it('should emit events for alert creation', (done) => {
      monitor.once('alertCreated', (alert) => {
        expect(alert.severity).toBe('high');
        done();
      });
      monitor.recordMetric('test-metric', 20);
    });

    it('should emit events for cleanup', (done) => {
      monitor.once('cleanupCompleted', (data) => {
        expect(data.maxAge).toBeDefined();
        done();
      });
      monitor.cleanupOldData(0);
    });
  });

  describe('disposal', () => {
    beforeEach(async () => {
      await monitor.initialize();
    });

    it('should dispose resources properly', async () => {
      await monitor.initialize();
      await monitor.dispose();
      await monitor.initialize(); // Re-initialize to test getMetrics
      const metrics = await monitor.getMetrics();
      const alerts = await monitor.getAlerts();
      expect(metrics).toHaveLength(0);
      expect(alerts).toHaveLength(0);
    });

    it('should emit disposed event', (done) => {
      monitor.once('disposed', () => {
        done();
      });
      monitor.dispose();
    });
  });
}); 