import { ModelMonitor } from '../modelMonitor';
import { Logger } from '../../utils/logger';
import { Storage } from '../../storage/storage';

describe('ModelMonitor', () => {
  let modelMonitor: ModelMonitor;
  let logger: Logger;
  let storage: Storage;
  let config: any;

  beforeEach(async () => {
    logger = new Logger('ModelMonitorTest');
    storage = new Storage();
    await storage.initialize();

    config = {
      storage: {
        path: '/tmp/metrics',
        retentionDays: 30
      },
      thresholds: {
        warning: { accuracy: 0.8, latency: 100, errorRate: 0.1 },
        error: { accuracy: 0.6, latency: 200, errorRate: 0.2 }
      },
      retentionPeriod: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
    };

    modelMonitor = new ModelMonitor(storage, config);
    await modelMonitor.initialize();
  });

  afterEach(async () => {
    await modelMonitor.cleanup();
    await storage.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize with valid config', async () => {
      expect(modelMonitor).toBeDefined();
      // Verify initialization by checking if we can record metrics
      const metrics = {
        accuracy: 0.95,
        latency: 50,
        errorRate: 0.05
      };
      await modelMonitor.recordMetrics(metrics);
      const recordedMetrics = await modelMonitor.getMetricsInRange(
        new Date(Date.now() - 1000),
        new Date()
      );
      expect(recordedMetrics).toBeDefined();
      expect(recordedMetrics.length).toBeGreaterThan(0);
    });

    it('should handle initialization errors', async () => {
      const invalidConfig = {} as any;
      const monitor = new ModelMonitor(storage, invalidConfig);
      await expect(monitor.initialize()).rejects.toThrow('Failed to initialize model monitor');
    });
  });

  describe('Metrics Collection', () => {
    it('should record metrics', async () => {
      const metrics = {
        accuracy: 0.95,
        latency: 50,
        errorRate: 0.05
      };

      await modelMonitor.recordMetrics(metrics);
      const recordedMetrics = await modelMonitor.getMetricsInRange(
        new Date(Date.now() - 1000),
        new Date()
      );
      expect(recordedMetrics).toBeDefined();
      expect(recordedMetrics.length).toBeGreaterThan(0);
      expect(recordedMetrics[0].accuracy).toBe(0.95);
    });

    it('should reject invalid metrics', async () => {
      const invalidMetrics = {
        invalidMetric: 0.95
      };

      await expect(modelMonitor.recordMetrics(invalidMetrics)).rejects.toThrow('Invalid metrics format');
    });
  });

  describe('Alert System', () => {
    it('should generate alert for critical threshold breach', async () => {
      const metrics = {
        accuracy: 0.5,
        latency: 250,
        errorRate: 0.25
      };

      await modelMonitor.recordMetrics(metrics);
      const alerts = await modelMonitor.getAlerts();
      expect(alerts).toBeDefined();
      expect(alerts.some(alert => alert.level === 'error')).toBe(true);
    });

    it('should generate alert for warning threshold breach', async () => {
      const metrics = {
        accuracy: 0.75,
        latency: 150,
        errorRate: 0.15
      };

      await modelMonitor.recordMetrics(metrics);
      const alerts = await modelMonitor.getAlerts();
      expect(alerts).toBeDefined();
      expect(alerts.some(alert => alert.level === 'warning')).toBe(true);
    });
  });

  describe('Data Management', () => {
    it('should clean up old metrics', async () => {
      // Record some metrics
      const metrics = {
        accuracy: 0.95,
        latency: 50,
        errorRate: 0.05
      };
      await modelMonitor.recordMetrics(metrics);

      // Force cleanup of old metrics
      await modelMonitor.cleanupOldMetrics();

      // Verify metrics are still accessible
      const recordedMetrics = await modelMonitor.getMetricsInRange(
        new Date(Date.now() - 1000),
        new Date()
      );
      expect(recordedMetrics).toBeDefined();
    });

    it('should retrieve metrics within time range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();

      // Record some metrics
      const metrics = {
        accuracy: 0.95,
        latency: 50,
        errorRate: 0.05
      };
      await modelMonitor.recordMetrics(metrics);

      const retrievedMetrics = await modelMonitor.getMetricsInRange(startDate, endDate);
      expect(retrievedMetrics).toBeDefined();
      expect(retrievedMetrics.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should handle high frequency metric recording', async () => {
      const metrics = {
        accuracy: 0.95,
        latency: 50,
        errorRate: 0.05
      };

      const start = Date.now();
      const promises = Array(100).fill(null).map(() => modelMonitor.recordMetrics(metrics));
      await Promise.all(promises);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should maintain performance during cleanup', async () => {
      const metrics = {
        accuracy: 0.95,
        latency: 50,
        errorRate: 0.05
      };

      await modelMonitor.recordMetrics(metrics);
      const start = Date.now();
      await modelMonitor.cleanupOldMetrics();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});