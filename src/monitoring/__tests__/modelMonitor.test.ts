import { ModelMonitor } from '../modelMonitor';
import { EventEmitter } from 'events';
import * as path from 'path';
import { createLogger } from '../../utils/logger';

// Create mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

// Mock the logger
jest.mock('../../utils/logger', () => ({
  createLogger: jest.fn().mockReturnValue(mockLogger)
}));

// Mock fs/promises
jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue('[]'),
  unlink: jest.fn().mockResolvedValue(undefined)
}));

describe('ModelMonitor', () => {
  let monitor: ModelMonitor;
  const testConfig = {
    modelId: 'test-model',
    metrics: ['accuracy', 'loss'],
    logInterval: 1000,
    thresholds: {
      accuracy: { warning: 0.8, critical: 0.7 },
      loss: { warning: 0.3, critical: 0.5 }
    },
    alertingEnabled: true,
    storageDirectory: path.join(process.cwd(), 'test-monitoring')
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    monitor = new ModelMonitor(testConfig);
    await monitor.initialize();
  });

  afterEach(async () => {
    if (monitor) {
      await monitor.stop();
    }
  });

  describe('Initialization', () => {
    it('should initialize with valid config', async () => {
      expect(monitor).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Initialized monitor for model ${testConfig.modelId}`,
        expect.any(Object)
      );
    });

    it('should throw error when initializing twice', async () => {
      await expect(monitor.initialize()).rejects.toThrow('Monitor already initialized');
    });
  });

  describe('Metrics Collection', () => {
    it('should record metrics', async () => {
      const metric = {
        timestamp: Date.now(),
        value: 0.95,
        metadata: { epoch: 1 }
      };
      await monitor.recordMetric('accuracy', metric.value, metric.metadata);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Recorded metric'),
        expect.any(Object)
      );
    });

    it('should reject invalid metric names', async () => {
      await expect(monitor.recordMetric('invalid', 0.5)).rejects.toThrow('Invalid metric name');
    });
  });

  describe('Alert System', () => {
    it('should generate alert for critical threshold breach', async () => {
      await monitor.recordMetric('accuracy', 0.6);
      const alerts = await monitor.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('critical');
    });

    it('should generate alert for warning threshold breach', async () => {
      await monitor.recordMetric('accuracy', 0.75);
      const alerts = await monitor.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('warning');
    });
  });

  describe('Data Management', () => {
    it('should clean up old metrics', async () => {
      const oldMetric = {
        timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days old
        value: 0.9
      };
      await monitor.recordMetric('accuracy', oldMetric.value);
      await monitor.cleanupOldData();
      const metrics = await monitor.getMetrics();
      expect(metrics.length).toBe(0);
    });

    it('should retrieve metrics within time range', async () => {
      const now = Date.now();
      await monitor.recordMetric('accuracy', 0.9);
      await monitor.recordMetric('accuracy', 0.95);
      const metrics = await monitor.getMetrics(now - 1000, now + 1000);
      expect(metrics.length).toBe(2);
    });
  });

  describe('Performance', () => {
    it('should handle high frequency metric recording', async () => {
      const promises = Array(100).fill(null).map(() =>
        monitor.recordMetric('accuracy', Math.random())
      );
      await expect(Promise.all(promises)).resolves.not.toThrow();
    });

    it('should maintain performance during cleanup', async () => {
      await Promise.all(Array(100).fill(null).map(() =>
        monitor.recordMetric('accuracy', Math.random())
      ));
      const start = Date.now();
      await monitor.cleanupOldData();
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete in less than 1s
    });
  });
});