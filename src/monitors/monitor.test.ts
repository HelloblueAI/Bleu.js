import { jest } from '@jest/globals';
import { Monitor } from './monitor';
import { ModelMonitor } from '../monitoring/modelMonitor';
import { createLogger, Logger } from '../utils/logger';
import fs from 'fs/promises';

// Mock the Logger class
jest.mock('../utils/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }))
}));

// Mock fs/promises
jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  writeFile: jest.fn(),
  readFile: jest.fn(),
  unlink: jest.fn()
}));

describe('Monitor', () => {
  let monitor: Monitor;
  let mockLogger: jest.Mocked<Logger>;
  const mockModelId = 'test-model';

  beforeEach(() => {
    mockLogger = new Logger('Monitor') as jest.Mocked<Logger>;
    monitor = new Monitor();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startMonitoring', () => {
    it('should create and start a new model monitor', async () => {
      const modelId = 'test-model';
      const config = {
        metrics: ['accuracy', 'loss'],
        logInterval: 1000,
        thresholds: {
          accuracy: { min: 0.8 },
          loss: { max: 0.2 }
        }
      };

      await monitor.startMonitoring(modelId, config);
      expect(mockLogger.info).toHaveBeenCalledWith(`Started monitoring for model: ${modelId}`);
    });

    it('should not create duplicate monitors for the same model', async () => {
      const modelId = 'test-model';
      const config = {
        metrics: ['accuracy'],
        logInterval: 1000
      };

      await monitor.startMonitoring(modelId, config);
      await expect(monitor.startMonitoring(modelId, config)).rejects.toThrow('Monitor already exists');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle errors during monitor creation', async () => {
      const modelId = 'test-model';
      const config = {
        metrics: ['accuracy'],
        logInterval: 1000
      };

      (fs.mkdir as jest.Mock).mockRejectedValue(new Error('Test error'));
      await expect(monitor.startMonitoring(modelId, config)).rejects.toThrow('Test error');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('stopMonitoring', () => {
    it('should stop and remove an existing monitor', async () => {
      const modelId = 'test-model';
      const config = {
        metrics: ['accuracy'],
        logInterval: 1000
      };

      await monitor.startMonitoring(modelId, config);
      await monitor.stopMonitoring(modelId);
      expect(mockLogger.info).toHaveBeenCalledWith(`Stopped monitoring for model: ${modelId}`);
    });

    it('should handle non-existent monitors gracefully', async () => {
      const modelId = 'non-existent';
      await expect(monitor.stopMonitoring(modelId)).rejects.toThrow('Monitor not found');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('recordMetric', () => {
    it('should record a metric for an existing monitor', async () => {
      const modelId = 'test-model';
      const config = {
        metrics: ['accuracy'],
        logInterval: 1000
      };

      await monitor.startMonitoring(modelId, config);
      await monitor.recordMetric(modelId, 'accuracy', 0.95);
      expect(mockLogger.info).toHaveBeenCalledWith(`Recorded metric for model ${modelId}: accuracy = 0.95`);
    });

    it('should throw error for non-existent monitor', async () => {
      const modelId = 'non-existent';
      await expect(monitor.recordMetric(modelId, 'accuracy', 0.95)).rejects.toThrow('Monitor not found');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getMetrics', () => {
    it('should retrieve metrics for an existing monitor', async () => {
      const modelId = 'test-model';
      const config = {
        metrics: ['accuracy'],
        logInterval: 1000
      };

      await monitor.startMonitoring(modelId, config);
      await monitor.recordMetric(modelId, 'accuracy', 0.95);
      const metrics = await monitor.getMetrics(modelId);
      expect(metrics).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith(`Retrieved metrics for model: ${modelId}`);
    });

    it('should throw error for non-existent monitor', async () => {
      const modelId = 'non-existent';
      await expect(monitor.getMetrics(modelId)).rejects.toThrow('Monitor not found');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getAlerts', () => {
    it('should retrieve alerts for an existing monitor', async () => {
      const modelId = 'test-model';
      const config = {
        metrics: ['accuracy'],
        logInterval: 1000,
        thresholds: {
          accuracy: { min: 0.8 }
        }
      };

      await monitor.startMonitoring(modelId, config);
      await monitor.recordMetric(modelId, 'accuracy', 0.75);
      const alerts = await monitor.getAlerts(modelId);
      expect(alerts).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith(`Retrieved alerts for model: ${modelId}`);
    });

    it('should throw error for non-existent monitor', async () => {
      const modelId = 'non-existent';
      await expect(monitor.getAlerts(modelId)).rejects.toThrow('Monitor not found');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('generateReport', () => {
    it('should generate a report for an existing monitor', async () => {
      const modelId = 'test-model';
      const config = {
        metrics: ['accuracy'],
        logInterval: 1000
      };

      await monitor.startMonitoring(modelId, config);
      await monitor.recordMetric(modelId, 'accuracy', 0.95);
      const report = await monitor.generateReport(modelId);
      expect(report).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith(`Generated report for model: ${modelId}`);
    });

    it('should throw error for non-existent monitor', async () => {
      const modelId = 'non-existent';
      await expect(monitor.generateReport(modelId)).rejects.toThrow('Monitor not found');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('generateAggregateReport', () => {
    it('should generate aggregate report for all monitors', async () => {
      const modelIds = ['model1', 'model2'];
      const config = {
        metrics: ['accuracy'],
        logInterval: 1000
      };

      await Promise.all(modelIds.map(id => monitor.startMonitoring(id, config)));
      await Promise.all(modelIds.map(id => monitor.recordMetric(id, 'accuracy', 0.95)));
      const report = await monitor.generateAggregateReport();
      expect(report).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith('Generated aggregate report for all models');
    });
  });

  describe('configuration updates', () => {
    it('should update thresholds for an existing monitor', async () => {
      const modelId = 'test-model';
      const config = {
        metrics: ['accuracy'],
        logInterval: 1000,
        thresholds: {
          accuracy: { min: 0.8 }
        }
      };

      await monitor.startMonitoring(modelId, config);
      await monitor.updateThresholds(modelId, { accuracy: { min: 0.9 } });
      expect(mockLogger.info).toHaveBeenCalledWith(`Updated thresholds for model: ${modelId}`);
    });

    it('should update monitoring interval for an existing monitor', async () => {
      const modelId = 'test-model';
      const config = {
        metrics: ['accuracy'],
        logInterval: 1000
      };

      await monitor.startMonitoring(modelId, config);
      await monitor.updateInterval(modelId, 2000);
      expect(mockLogger.info).toHaveBeenCalledWith(`Updated monitoring interval for model: ${modelId}`);
    });

    it('should toggle alerting for an existing monitor', async () => {
      const modelId = 'test-model';
      const config = {
        metrics: ['accuracy'],
        logInterval: 1000,
        alerting: true
      };

      await monitor.startMonitoring(modelId, config);
      await monitor.toggleAlerting(modelId, false);
      expect(mockLogger.info).toHaveBeenCalledWith(`Toggled alerting for model: ${modelId}`);
    });
  });

  describe('utility methods', () => {
    it('should check if a model is being monitored', async () => {
      const modelId = 'test-model';
      const config = {
        metrics: ['accuracy'],
        logInterval: 1000
      };

      await monitor.startMonitoring(modelId, config);
      expect(await monitor.isMonitored(modelId)).toBe(true);
      expect(mockLogger.debug).toHaveBeenCalledWith(`Checking monitoring status for model: ${modelId}`);
    });

    it('should get list of monitored models', async () => {
      const modelIds = ['model1', 'model2'];
      const config = {
        metrics: ['accuracy'],
        logInterval: 1000
      };

      await Promise.all(modelIds.map(id => monitor.startMonitoring(id, config)));
      const monitoredModels = await monitor.getMonitoredModels();
      expect(monitoredModels).toEqual(expect.arrayContaining(modelIds));
      await monitor.startMonitoring('model1');
      await monitor.startMonitoring('model2');

      const models = monitor.getMonitoredModels();
      expect(models).toEqual(['model1', 'model2']);
    });
  });
}); 