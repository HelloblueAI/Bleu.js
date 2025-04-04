import { PerformanceOptimizer } from '../performance_optimizer';
import { OperationsManager } from '../operations_manager';
import { SystemMonitor } from '../system_monitor';

describe('PerformanceOptimizer Integration Tests', () => {
  let optimizer: PerformanceOptimizer;
  let operationsManager: OperationsManager;
  let systemMonitor: SystemMonitor;
  let optimizationEvents: string[];
  let bottleneckEvents: string[];

  function waitForOptimizationEvents(): Promise<string[]> {
    const events: string[] = [];
    return new Promise((resolve) => {
      optimizer.on('scale', () => {
        events.push('scale');
        resolve(events);
      });
    });
  }

  beforeEach(() => {
    // Initialize with custom config for testing
    operationsManager = new OperationsManager({
      maxConcurrentTasks: 2,
      autoScaling: true,
      resourceLimits: {
        memory: 512 * 1024 * 1024, // 512MB
        cpu: 70, // 70% max CPU
        network: 1000 * 1024, // 1000KB/s
      },
      optimizationRules: [
        { threshold: 0.7, action: 'alert', priority: 1, cooldown: 60000 },
        { threshold: 0.8, action: 'optimize', priority: 2, cooldown: 120000 },
        { threshold: 0.9, action: 'scale', priority: 3, cooldown: 300000 },
      ],
      taskPriorities: {
        default: 1,
        high: 2,
        low: 0,
        critical: 3
      },
      adaptiveThresholds: true
    });

    systemMonitor = new SystemMonitor({ updateInterval: 1000 }); // 1 second interval for testing
    optimizer = new PerformanceOptimizer(operationsManager, systemMonitor);
    
    optimizationEvents = [];
    bottleneckEvents = [];

    // Track optimization events
    optimizer.on('optimization-started', (strategy) => {
      optimizationEvents.push(`started:${strategy}`);
    });
    optimizer.on('optimization-completed', (strategy) => {
      optimizationEvents.push(`completed:${strategy}`);
    });
    optimizer.on('bottleneck-detected', (bottlenecks) => {
      bottleneckEvents.push(...bottlenecks);
    });
  });

  afterEach(() => {
    optimizer.cleanup();
    operationsManager.cleanup();
    systemMonitor.cleanup();
  });

  describe('Resource Optimization Scenarios', () => {
    it('should trigger memory optimization when memory usage exceeds threshold', async () => {
      // Simulate high memory usage
      const highMemoryMetrics = {
        memory: { percentage: 85 },
        cpu: { usage: 50 },
        taskQueue: { size: 5 },
      };

      await optimizer['handleMetricsUpdate'](highMemoryMetrics);

      expect(optimizationEvents).toContain('started:Memory Optimization');
      expect(optimizationEvents).toContain('completed:Memory Optimization');
    });

    it('should handle multiple concurrent optimization strategies in priority order', async () => {
      // Simulate multiple resource pressure points
      const criticalMetrics = {
        memory: { percentage: 90 },
        cpu: { usage: 75 },
        taskQueue: { size: 15 },
      };

      await optimizer['handleMetricsUpdate'](criticalMetrics);

      // Verify priority order execution
      const startEvents = optimizationEvents.filter(e => e.startsWith('started:'));
      expect(startEvents).toEqual([
        'started:Memory Optimization',
        'started:CPU Optimization',
        'started:Task Queue Optimization',
      ]);
    });

    it('should prevent concurrent optimization runs', async () => {
      // Simulate rapid consecutive metric updates
      const metrics = {
        memory: { percentage: 85 },
        cpu: { usage: 50 },
      };

      const promise1 = optimizer['handleMetricsUpdate'](metrics);
      const promise2 = optimizer['handleMetricsUpdate'](metrics);

      await Promise.all([promise1, promise2]);

      // Verify only one optimization cycle executed
      const memoryOptimizations = optimizationEvents.filter(
        e => e === 'started:Memory Optimization'
      );
      expect(memoryOptimizations).toHaveLength(1);
    });
  });

  describe('Bottleneck Detection and Response', () => {
    it('should handle complex bottleneck scenarios', async () => {
      const complexBottlenecks = [
        'High memory utilization: 95%',
        'High CPU utilization: 85%',
        'Slow task execution: critical-task',
      ];

      await optimizer['handleBottleneck'](complexBottlenecks);

      expect(bottleneckEvents).toEqual(complexBottlenecks);
      expect(optimizationEvents).toContain('started:Memory Optimization');
      expect(optimizationEvents).toContain('started:CPU Optimization');
    });

    it('should execute appropriate optimization actions based on severity', async () => {
      const optimizationData = {
        action: 'scale',
        utilization: 0.95,
        threshold: 0.9,
      };

      const eventsPromise = waitForOptimizationEvents();
      await optimizer['handleOptimizationNeeded'](optimizationData);
      const events = await eventsPromise;
      expect(events).toContain('scale');
    });
  });

  describe('System Integration', () => {
    it('should maintain system stability under load', async () => {
      // Test implementation will be added later
      expect(optimizer.getOptimizationStatus().isOptimizing).toBe(false);
    });
  });
});