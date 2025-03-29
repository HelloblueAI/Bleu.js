import { describe, expect, jest } from '@jest/globals';
import { ModelMonitor } from './modelMonitor';
import { MonitorError } from '../types/errors';
import { createLogger } from '../utils/logger';
import { MonitoringConfig } from '../types/monitoring';
import fs from 'fs';

jest.mock('fs');
jest.mock('../utils/logger');

describe('ModelMonitor', () => {
  let monitor: ModelMonitor;
  let mockLogger: any;
  
  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };
    (createLogger as jest.Mock).mockReturnValue(mockLogger);
    
    const config: MonitoringConfig = {
      modelId: 'test-model',
      metrics: {
        thresholds: {
          accuracy: { critical: 0.6, warning: 0.8 },
          latency: { critical: 100, warning: 50 }
        },
        interval: 1000
      }
    };
    
    monitor = new ModelMonitor(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(monitor.initialize()).resolves.not.toThrow();
      expect(mockLogger.info).toHaveBeenCalledWith('ModelMonitor initialized');
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Initialization failed');
      mockLogger.info.mockImplementation(() => { throw error; });
      await expect(monitor.initialize()).rejects.toThrow(error);
    });
  });

  describe('Monitoring', () => {
    beforeEach(async () => {
      await monitor.initialize();
    });

    it('should start monitoring', async () => {
      await monitor.startMonitoring();
      expect(mockLogger.info).toHaveBeenCalledWith('Monitoring started');
    });

    it('should stop monitoring', async () => {
      await monitor.startMonitoring();
      await monitor.stopMonitoring();
      expect(mockLogger.info).toHaveBeenCalledWith('Monitoring stopped');
    });

    it('should handle monitoring errors', async () => {
      const error = new Error('Monitoring error');
      mockLogger.info.mockImplementation(() => { throw error; });
      await expect(monitor.startMonitoring()).rejects.toThrow(error);
    });
  });

  describe('Metric Collection', () => {
    beforeEach(async () => {
      await monitor.initialize();
    });

    it('should record metrics', async () => {
      const metrics = { accuracy: 0.95, latency: 50 };
      await monitor.recordMetric(metrics);
      expect(mockLogger.debug).toHaveBeenCalledWith('Metric recorded:', metrics);
    });

    it('should aggregate metrics', async () => {
      const metrics = [
        { accuracy: 0.95, latency: 50 },
        { accuracy: 0.90, latency: 60 }
      ];
      
      for (const metric of metrics) {
        await monitor.recordMetric(metric);
      }
      
      const aggregated = await monitor.getAggregatedMetrics();
      expect(aggregated).toBeDefined();
      expect(aggregated.accuracy).toBeCloseTo(0.925);
      expect(aggregated.latency).toBeCloseTo(55);
    });

    it('should handle collection errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      await monitor.startMonitoring();
      (fs.writeFile as jest.Mock).mockImplementation((path, data, callback) => {
        callback(new Error('Write error'));
      });
      await monitor.recordMetric({ accuracy: 0.95 });
      expect(mockLogger.error).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe('Alert System', () => {
    beforeEach(async () => {
      await monitor.initialize();
    });

    it('should trigger alerts for critical thresholds', async () => {
      const metrics = { accuracy: 0.5, latency: 50 };
      await monitor.recordMetric(metrics);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Critical threshold breach:',
        expect.stringContaining('accuracy')
      );
    });

    it('should trigger warnings for warning thresholds', async () => {
      const metrics = { accuracy: 0.75, latency: 50 };
      await monitor.recordMetric(metrics);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Warning threshold breach:',
        expect.stringContaining('accuracy')
      );
    });
  });

  describe('Data Management', () => {
    beforeEach(async () => {
      await monitor.initialize();
    });

    it('should clean up old metrics', async () => {
      await monitor.recordMetric('test', { value: 1 });
      await monitor.cleanupOldMetrics(0);
      expect(mockLogger.info).toHaveBeenCalledWith('Cleaned up old metrics');
    });

    it('should handle cleanup errors', async () => {
      const error = new Error('Cleanup failed');
      (fs.unlink as jest.Mock).mockImplementation((path, callback) => {
        callback(error);
      });

      await monitor.cleanupOldMetrics(0);
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to clean up metrics:', error);
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await monitor.initialize();
    });

    it('should handle concurrent metric recording', async () => {
      const promises = Array(10).fill(null).map((_, i) =>
        monitor.recordMetric(`test${i}`, { value: i })
      );
      await Promise.all(promises);
      expect(mockLogger.debug).toHaveBeenCalledTimes(10);
    });

    it('should maintain performance under load', async () => {
      const start = Date.now();
      await Promise.all(
        Array(100).fill(null).map((_, i) =>
          monitor.recordMetric(`test${i}`, { value: i })
        )
      );
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });
}); 