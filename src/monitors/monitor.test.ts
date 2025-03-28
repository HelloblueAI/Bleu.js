import { jest } from '@jest/globals';
import { Monitor } from './monitor';
import { ModelMonitor } from '../monitoring/modelMonitor';
import { createLogger } from '../utils/logger';

// Mock the logger and ModelMonitor
jest.mock('../utils/logger', () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })
}));

jest.mock('../monitoring/modelMonitor');

describe('Monitor', () => {
  let monitor: Monitor;
  const mockModelId = 'test-model';

  beforeEach(() => {
    jest.clearAllMocks();
    monitor = new Monitor();
  });

  describe('startMonitoring', () => {
    it('should create and start a new model monitor', async () => {
      const mockModelMonitor = {
        start: jest.fn(),
        initialize: jest.fn()
      };
      (ModelMonitor as jest.Mock).mockImplementation(() => mockModelMonitor);

      await monitor.startMonitoring(mockModelId);

      expect(ModelMonitor).toHaveBeenCalledWith(expect.objectContaining({
        modelId: mockModelId
      }));
      expect(mockModelMonitor.start).toHaveBeenCalled();
    });

    it('should not create duplicate monitors for the same model', async () => {
      await monitor.startMonitoring(mockModelId);
      await monitor.startMonitoring(mockModelId);

      expect(ModelMonitor).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during monitor creation', async () => {
      const error = new Error('Test error');
      (ModelMonitor as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await expect(monitor.startMonitoring(mockModelId)).rejects.toThrow(error);
    });
  });

  describe('stopMonitoring', () => {
    it('should stop and remove an existing monitor', async () => {
      const mockModelMonitor = {
        start: jest.fn(),
        stop: jest.fn(),
        initialize: jest.fn()
      };
      (ModelMonitor as jest.Mock).mockImplementation(() => mockModelMonitor);

      await monitor.startMonitoring(mockModelId);
      await monitor.stopMonitoring(mockModelId);

      expect(mockModelMonitor.stop).toHaveBeenCalled();
    });

    it('should handle non-existent monitors gracefully', async () => {
      await expect(monitor.stopMonitoring('non-existent')).resolves.not.toThrow();
    });
  });

  describe('recordMetric', () => {
    it('should record a metric for an existing monitor', async () => {
      const mockModelMonitor = {
        start: jest.fn(),
        recordMetric: jest.fn(),
        initialize: jest.fn()
      };
      (ModelMonitor as jest.Mock).mockImplementation(() => mockModelMonitor);

      await monitor.startMonitoring(mockModelId);
      await monitor.recordMetric(mockModelId, 'accuracy', 0.95);

      expect(mockModelMonitor.recordMetric).toHaveBeenCalledWith('accuracy', 0.95);
    });

    it('should throw error for non-existent monitor', async () => {
      await expect(monitor.recordMetric('non-existent', 'accuracy', 0.95))
        .rejects.toThrow('No monitor found');
    });
  });

  describe('getMetrics', () => {
    it('should retrieve metrics for an existing monitor', async () => {
      const mockMetrics = [{ timestamp: Date.now(), value: 0.95 }];
      const mockModelMonitor = {
        start: jest.fn(),
        getMetrics: jest.fn().mockResolvedValue(mockMetrics),
        initialize: jest.fn()
      };
      (ModelMonitor as jest.Mock).mockImplementation(() => mockModelMonitor);

      await monitor.startMonitoring(mockModelId);
      const metrics = await monitor.getMetrics(mockModelId);

      expect(metrics).toEqual(mockMetrics);
    });

    it('should throw error for non-existent monitor', async () => {
      await expect(monitor.getMetrics('non-existent'))
        .rejects.toThrow('No monitor found');
    });
  });

  describe('getAlerts', () => {
    it('should retrieve alerts for an existing monitor', async () => {
      const mockAlerts = [{ timestamp: Date.now(), type: 'warning' }];
      const mockModelMonitor = {
        start: jest.fn(),
        getAlerts: jest.fn().mockResolvedValue(mockAlerts),
        initialize: jest.fn()
      };
      (ModelMonitor as jest.Mock).mockImplementation(() => mockModelMonitor);

      await monitor.startMonitoring(mockModelId);
      const alerts = await monitor.getAlerts(mockModelId);

      expect(alerts).toEqual(mockAlerts);
    });

    it('should throw error for non-existent monitor', async () => {
      await expect(monitor.getAlerts('non-existent'))
        .rejects.toThrow('No monitor found');
    });
  });

  describe('generateReport', () => {
    it('should generate a report for an existing monitor', async () => {
      const mockModelMonitor = {
        start: jest.fn(),
        getMetrics: jest.fn().mockResolvedValue([]),
        getAlerts: jest.fn().mockResolvedValue([]),
        initialize: jest.fn()
      };
      (ModelMonitor as jest.Mock).mockImplementation(() => mockModelMonitor);

      await monitor.startMonitoring(mockModelId);
      const report = await monitor.generateReport(mockModelId);

      expect(report).toHaveProperty('modelId', mockModelId);
      expect(report).toHaveProperty('status');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('alerts');
    });

    it('should throw error for non-existent monitor', async () => {
      await expect(monitor.generateReport('non-existent'))
        .rejects.toThrow('No monitor found');
    });
  });

  describe('generateAggregateReport', () => {
    it('should generate aggregate report for all monitors', async () => {
      const mockModelMonitor = {
        start: jest.fn(),
        getMetrics: jest.fn().mockResolvedValue([]),
        getAlerts: jest.fn().mockResolvedValue([]),
        initialize: jest.fn()
      };
      (ModelMonitor as jest.Mock).mockImplementation(() => mockModelMonitor);

      await monitor.startMonitoring('model1');
      await monitor.startMonitoring('model2');

      const report = await monitor.generateAggregateReport();

      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('summary');
      expect(report.summary).toHaveProperty('totalModels', 2);
    });
  });

  describe('configuration updates', () => {
    let mockModelMonitor: any;

    beforeEach(async () => {
      mockModelMonitor = {
        start: jest.fn(),
        updateThresholds: jest.fn(),
        updateMonitoringInterval: jest.fn(),
        toggleAlerting: jest.fn(),
        initialize: jest.fn()
      };
      (ModelMonitor as jest.Mock).mockImplementation(() => mockModelMonitor);
      await monitor.startMonitoring(mockModelId);
    });

    it('should update thresholds for an existing monitor', async () => {
      const thresholds = { accuracy: { warning: 0.8, critical: 0.6 } };
      await monitor.updateThresholds(mockModelId, thresholds);
      expect(mockModelMonitor.updateThresholds).toHaveBeenCalledWith(thresholds);
    });

    it('should update monitoring interval for an existing monitor', async () => {
      const interval = 30000;
      await monitor.updateMonitoringInterval(mockModelId, interval);
      expect(mockModelMonitor.updateMonitoringInterval).toHaveBeenCalledWith(interval);
    });

    it('should toggle alerting for an existing monitor', async () => {
      await monitor.toggleAlerting(mockModelId, false);
      expect(mockModelMonitor.toggleAlerting).toHaveBeenCalledWith(false);
    });
  });

  describe('utility methods', () => {
    it('should check if a model is being monitored', async () => {
      const mockModelMonitor = {
        start: jest.fn(),
        initialize: jest.fn()
      };
      (ModelMonitor as jest.Mock).mockImplementation(() => mockModelMonitor);

      expect(monitor.isMonitoring(mockModelId)).toBe(false);
      await monitor.startMonitoring(mockModelId);
      expect(monitor.isMonitoring(mockModelId)).toBe(true);
    });

    it('should get list of monitored models', async () => {
      const mockModelMonitor = {
        start: jest.fn(),
        initialize: jest.fn()
      };
      (ModelMonitor as jest.Mock).mockImplementation(() => mockModelMonitor);

      await monitor.startMonitoring('model1');
      await monitor.startMonitoring('model2');

      const models = monitor.getMonitoredModels();
      expect(models).toEqual(['model1', 'model2']);
    });
  });
}); 