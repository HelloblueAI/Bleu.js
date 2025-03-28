import { jest } from '@jest/globals';
import { ModelMonitor } from './modelMonitor';
import * as fs from 'fs/promises';
import * as path from 'path';

jest.mock('fs/promises');
jest.mock('path');

describe('ModelMonitor', () => {
  let monitor: ModelMonitor;
  const mockConfig = {
    modelId: 'test-model',
    metrics: ['accuracy', 'latency', 'memory'],
    logInterval: 1000,
    thresholds: {
      accuracy: { warning: 0.8, critical: 0.6 },
      latency: { warning: 1000, critical: 2000 },
      memory: { warning: 80, critical: 90 }
    },
    alertingEnabled: true,
    storageDirectory: 'test_monitoring'
  };

  beforeEach(() => {
    jest.useFakeTimers();
    monitor = new ModelMonitor(mockConfig);
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.readFile as jest.Mock).mockResolvedValue('[]');
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const defaultMonitor = new ModelMonitor({
        modelId: 'test-model'
      });
      expect(defaultMonitor['config'].alertingEnabled).toBe(true);
      expect(defaultMonitor['config'].logInterval).toBe(60000);
    });

    it('should create storage directory on initialization', async () => {
      await monitor.startMonitoring();
      expect(fs.mkdir).toHaveBeenCalledWith(mockConfig.storageDirectory, { recursive: true });
    });
  });

  describe('Monitoring Lifecycle', () => {
    it('should start monitoring successfully', async () => {
      await monitor.startMonitoring();
      expect(monitor['monitoring']).toBe(true);
      expect(monitor['intervalId']).toBeDefined();
    });

    it('should stop monitoring successfully', async () => {
      await monitor.startMonitoring();
      await monitor.stopMonitoring();
      expect(monitor['monitoring']).toBe(false);
      expect(monitor['intervalId']).toBeNull();
    });

    it('should handle monitoring errors gracefully', async () => {
      (fs.mkdir as jest.Mock).mockRejectedValue(new Error('Test error'));
      await expect(monitor.startMonitoring()).rejects.toThrow('Test error');
    });
  });

  describe('Metric Recording', () => {
    beforeEach(async () => {
      await monitor.startMonitoring();
    });

    it('should record valid metrics', async () => {
      await monitor.recordMetric('accuracy', 0.95);
      expect(monitor['metrics']).toHaveLength(1);
      expect(monitor['metrics'][0].name).toBe('accuracy');
      expect(monitor['metrics'][0].value).toBe(0.95);
    });

    it('should reject invalid metrics', async () => {
      await expect(monitor.recordMetric('invalid', 1)).rejects.toThrow('Invalid metric');
    });

    it('should persist metrics to storage', async () => {
      await monitor.recordMetric('accuracy', 0.95);
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('Alert Handling', () => {
    beforeEach(async () => {
      await monitor.startMonitoring();
    });

    it('should generate warning alerts', async () => {
      await monitor.recordMetric('accuracy', 0.7);
      expect(monitor['alerts']).toHaveLength(1);
      expect(monitor['alerts'][0].type).toBe('warning');
    });

    it('should generate critical alerts', async () => {
      await monitor.recordMetric('accuracy', 0.5);
      expect(monitor['alerts']).toHaveLength(1);
      expect(monitor['alerts'][0].type).toBe('critical');
    });

    it('should persist alerts to storage', async () => {
      await monitor.recordMetric('accuracy', 0.5);
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('Metric Collection', () => {
    it('should collect metrics periodically', async () => {
      await monitor.startMonitoring();
      await monitor.recordMetric('accuracy', 0.95);
      jest.advanceTimersByTime(mockConfig.logInterval);
      expect(monitor['metrics'].length).toBeGreaterThan(0);
    });

    it('should handle collection errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      await monitor.startMonitoring();
      (fs.writeFile as jest.Mock).mockRejectedValue(new Error('Test error'));
      await monitor.recordMetric('accuracy', 0.95);
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe('Report Generation', () => {
    beforeEach(async () => {
      await monitor.startMonitoring();
    });

    it('should generate comprehensive reports', async () => {
      await monitor.recordMetric('accuracy', 0.95);
      const metrics = monitor.generateMetricsSummary();
      expect(metrics.accuracy).toBeDefined();
      expect(metrics.accuracy.avg).toBe(0.95);
    });

    it('should include alerts in reports', async () => {
      await monitor.recordMetric('accuracy', 0.5);
      const alerts = monitor.getAlerts();
      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('critical');
    });
  });

  describe('Data Persistence', () => {
    beforeEach(async () => {
      await monitor.startMonitoring();
    });

    it('should persist alerts successfully', async () => {
      await monitor.recordMetric('accuracy', 0.5);
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should handle file system errors gracefully', async () => {
      (fs.writeFile as jest.Mock).mockRejectedValue(new Error('Test error'));
      await expect(monitor.recordMetric('accuracy', 0.5)).rejects.toThrow('Test error');
    });
  });
}); 