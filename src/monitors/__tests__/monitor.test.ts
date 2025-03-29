import { Monitor } from '../monitor';
import { MonitorError } from '../../errors/monitorError';
import { Storage } from '../../storage/storage';
import { MetricsManager } from '../../utils/metrics';
import { createLogger } from '../../utils/logger';
import { ILogger } from '../../utils/logger';

jest.mock('../../utils/logger');
jest.mock('../../storage/storage');
jest.mock('../../utils/metrics');

describe('Monitor', () => {
  let monitor: Monitor;
  let storage: Storage;
  let metricsManager: MetricsManager;
  let mockLogger: ILogger;

  beforeEach(async () => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      security: jest.fn(),
      audit: jest.fn(),
      performance: jest.fn()
    } as unknown as ILogger;

    storage = {
      initialize: jest.fn().mockResolvedValue(undefined),
      cleanup: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      list: jest.fn().mockResolvedValue([]),
      getFilePath: jest.fn().mockReturnValue('test-path'),
      initialized: false,
      logger: mockLogger
    } as unknown as Storage;

    metricsManager = {
      recordMetric: jest.fn().mockResolvedValue(undefined),
      getMetrics: jest.fn().mockResolvedValue([]),
      cleanup: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn().mockResolvedValue(undefined)
    } as unknown as MetricsManager;

    monitor = new Monitor(storage, {
      monitoringInterval: 1000,
      retentionPeriod: 3600000,
      warningThreshold: 0.8,
      criticalThreshold: 0.95,
      metricsCollector: metricsManager
    }, metricsManager, mockLogger);

    await monitor.initialize();

    // Initialize a test model monitor
    await monitor.startMonitoring('test-model');
  });

  afterEach(async () => {
    await monitor.cleanup();
  });

  describe('initialization', () => {
    it('should initialize with default config', async () => {
      const config = monitor.getConfig();
      expect(config).toBeDefined();
      expect(config.monitoringInterval).toBeGreaterThan(0);
      expect(config.retentionPeriod).toBeGreaterThan(0);
    });
  });

  describe('metric recording', () => {
    it('should record metrics successfully', async () => {
      const modelId = 'test-model';
      const metrics = { accuracy: 0.95, latency: 100 };

      await monitor.recordMetrics(modelId, metrics);
      expect(storage.save).toHaveBeenCalledWith(
        expect.stringContaining('metrics'),
        expect.objectContaining(metrics)
      );
    });

    it('should create warning alert for threshold violation', async () => {
      const modelId = 'test-model';
      const metrics = { accuracy: 0.75 };

      await monitor.recordMetrics(modelId, metrics);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('warning'),
        expect.objectContaining({ modelId, metrics })
      );
    });

    it('should create error alert for threshold violation', async () => {
      const modelId = 'test-model';
      const metrics = { accuracy: 0.5 };

      await monitor.recordMetrics(modelId, metrics);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('critical'),
        expect.objectContaining({ modelId, metrics })
      );
    });
  });

  describe('data retrieval', () => {
    it('should get metrics within time range', async () => {
      const modelId = 'test-model';
      const startTime = Date.now() - 3600000;
      const endTime = Date.now();

      await monitor.getMetricsInRange(modelId, startTime, endTime);
      expect(storage.get).toHaveBeenCalledWith(
        expect.stringContaining('metrics'),
        expect.objectContaining({ startTime, endTime })
      );
    });

    it('should get all alerts', async () => {
      const modelId = 'test-model';

      await monitor.getAlerts(modelId);
      expect(storage.get).toHaveBeenCalledWith(
        expect.stringContaining('alerts'),
        expect.objectContaining({ modelId })
      );
    });
  });

  describe('cleanup', () => {
    it('should clean up old data', async () => {
      await monitor.cleanupOldMetrics();
      expect(storage.delete).toHaveBeenCalledWith(
        expect.stringContaining('metrics'),
        expect.any(Object)
      );
    });
  });

  describe('report generation', () => {
    it('should generate report', async () => {
      const modelId = 'test-model';

      await monitor.generateReport(modelId);
      expect(storage.get).toHaveBeenCalledWith(
        expect.stringContaining('metrics'),
        expect.objectContaining({ modelId })
      );
    });
  });

  describe('error handling', () => {
    it('should handle storage errors gracefully', async () => {
      const modelId = 'test-model';
      const metrics = { accuracy: 0.95 };
      (storage.save as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(monitor.recordMetrics(modelId, metrics)).rejects.toThrow('Storage error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to record metrics'),
        expect.any(Error)
      );
    });
  });
}); 