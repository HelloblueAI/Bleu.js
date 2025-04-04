import { EventEmitter } from 'events';

interface OperationalMetrics {
  taskExecutionTimes: Record<string, number>;
  resourceUtilization: number;
  bottlenecks: string[];
  errorRates: Record<string, number>;
  costMetrics: {
    computeCost: number;
    resourceCost: number;
    memoryUsage: number;
    networkUsage: number;
  };
  qualityMetrics: {
    successRate: number;
    performanceScore: number;
    reliability: number;
    availability: number;
  };
  throughput: {
    tasksPerSecond: number;
    successfulTasks: number;
    failedTasks: number;
  };
}

interface SystemConfig {
  maxConcurrentTasks: number;
  autoScaling: boolean;
  resourceLimits: {
    memory: number;
    cpu: number;
    network: number;
  };
  optimizationRules: Array<{
    threshold: number;
    action: 'alert' | 'optimize' | 'scale';
    priority: number;
    cooldown: number;
  }>;
  taskPriorities: {
    default: number;
    high: number;
    low: number;
    critical: number;
  };
  adaptiveThresholds: boolean;
}

interface TaskMetadata {
  priority: number;
  startTime: number;
  attempts: number;
  maxRetries: number;
  lastError?: Error;
  category: string;
}

export class OperationsManager extends EventEmitter {
  private readonly config: SystemConfig;
  private readonly metrics: OperationalMetrics = {
    taskExecutionTimes: {},
    resourceUtilization: 0,
    bottlenecks: [],
    errorRates: {},
    costMetrics: {
      computeCost: 0,
      resourceCost: 0,
      memoryUsage: 0,
      networkUsage: 0,
    },
    qualityMetrics: {
      successRate: 100,
      performanceScore: 100,
      reliability: 100,
      availability: 100,
    },
    throughput: {
      tasksPerSecond: 0,
      successfulTasks: 0,
      failedTasks: 0,
    },
  };

  private readonly taskQueue: Map<string, Promise<unknown>> = new Map();
  private readonly taskMetadata: Map<string, TaskMetadata> = new Map();
  private readonly bottleneckDetector: NodeJS.Timeout;
  private readonly adaptiveThresholds: Map<string, number> = new Map();
  private readonly lastOptimizations: Map<string, number> = new Map();
  private isProcessing = false;
  private readonly startTime: number;

  constructor(config: SystemConfig) {
    super();
    this.config = this.validateConfig(config);
    this.startTime = Date.now();
    this.bottleneckDetector = this.initializeBottleneckDetection();
    this.initializeAdaptiveThresholds();
  }

  private validateConfig(config: SystemConfig): SystemConfig {
    if (config.maxConcurrentTasks < 1) {
      throw new Error('maxConcurrentTasks must be at least 1');
    }
    if (config.resourceLimits.cpu < 0 || config.resourceLimits.cpu > 100) {
      throw new Error('CPU limit must be between 0 and 100');
    }
    return config;
  }

  private initializeAdaptiveThresholds(): void {
    if (!this.config.adaptiveThresholds) return;

    this.adaptiveThresholds.set('cpu', this.config.resourceLimits.cpu);
    this.adaptiveThresholds.set('memory', this.config.resourceLimits.memory);
    this.adaptiveThresholds.set('network', this.config.resourceLimits.network);

    // Adjust thresholds based on historical performance
    setInterval(() => {
      this.updateAdaptiveThresholds();
    }, 60000);
  }

  private updateAdaptiveThresholds(): void {
    const performanceScore = this.metrics.qualityMetrics.performanceScore;
    const utilizationRate = this.metrics.resourceUtilization;

    // Adjust thresholds based on performance and utilization
    this.adaptiveThresholds.forEach((threshold, resource) => {
      let adjustment = 0;

      if (performanceScore > 90 && utilizationRate < threshold * 0.8) {
        // System performing well with low utilization - increase threshold
        adjustment = 5;
      } else if (performanceScore < 70 || utilizationRate > threshold * 0.9) {
        // System struggling - decrease threshold
        adjustment = -5;
      }

      const newThreshold = Math.max(
        50,
        Math.min(95, threshold + adjustment)
      );
      this.adaptiveThresholds.set(resource, newThreshold);
    });
  }

  private initializeBottleneckDetection(): NodeJS.Timeout {
    return setInterval(() => {
      void this.detectBottlenecks();
    }, 5000);
  }

  private async detectBottlenecks(): Promise<void> {
    const bottlenecks: string[] = [];

    // Check resource utilization with adaptive thresholds
    const cpuThreshold = this.adaptiveThresholds.get('cpu') ?? this.config.resourceLimits.cpu;
    if (this.metrics.resourceUtilization > cpuThreshold) {
      bottlenecks.push(`High CPU utilization: ${this.metrics.resourceUtilization}%`);
    }

    // Check memory usage
    const memoryThreshold = this.adaptiveThresholds.get('memory') ?? this.config.resourceLimits.memory;
    if (this.metrics.costMetrics.memoryUsage > memoryThreshold) {
      bottlenecks.push(`High memory usage: ${this.metrics.costMetrics.memoryUsage}MB`);
    }

    // Check task queue health
    if (this.taskQueue.size > this.config.maxConcurrentTasks) {
      const avgWaitTime = this.calculateAverageWaitTime();
      bottlenecks.push(
        `Task queue overload: ${this.taskQueue.size} tasks pending, avg wait ${avgWaitTime}ms`
      );
    }

    // Check error rates with categories
    const errorsByCategory = this.groupErrorsByCategory();
    for (const [category, rate] of errorsByCategory) {
      if (rate > 0.1) { // 10% threshold
        bottlenecks.push(`High error rate in ${category}: ${(rate * 100).toFixed(1)}%`);
      }
    }

    // Check throughput degradation
    const currentThroughput = this.calculateCurrentThroughput();
    const historicalThroughput = this.metrics.throughput.tasksPerSecond;
    if (currentThroughput < historicalThroughput * 0.7) { // 30% degradation
      bottlenecks.push(
        `Throughput degradation: Current ${currentThroughput.toFixed(2)} tasks/s ` +
        `(Historical: ${historicalThroughput.toFixed(2)} tasks/s)`
      );
    }

    if (bottlenecks.length > 0) {
      this.emit('bottleneck-detected', bottlenecks);
      await this.handleBottlenecks(bottlenecks);
    }
  }

  private calculateAverageWaitTime(): number {
    const waitTimes = Array.from(this.taskMetadata.values())
      .map(metadata => Date.now() - metadata.startTime);
    return waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length || 0;
  }

  private groupErrorsByCategory(): Map<string, number> {
    const errorsByCategory = new Map<string, number>();
    
    for (const [taskName, rate] of Object.entries(this.metrics.errorRates)) {
      const category = this.taskMetadata.get(taskName)?.category ?? 'unknown';
      const current = errorsByCategory.get(category) ?? 0;
      errorsByCategory.set(category, current + rate);
    }

    return errorsByCategory;
  }

  private calculateCurrentThroughput(): number {
    const timeWindow = 60000; // 1 minute
    const recentTasks = Array.from(this.taskMetadata.values())
      .filter(metadata => Date.now() - metadata.startTime < timeWindow);
    return (recentTasks.length / timeWindow) * 1000; // tasks per second
  }

  private async handleBottlenecks(bottlenecks: string[]): Promise<void> {
    const currentTime = Date.now();
    const sortedRules = [...this.config.optimizationRules].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      const lastOptimization = this.lastOptimizations.get(rule.action) ?? 0;
      const cooldownPassed = currentTime - lastOptimization > rule.cooldown;

      if (this.metrics.resourceUtilization > rule.threshold * 100 && cooldownPassed) {
        this.lastOptimizations.set(rule.action, currentTime);
        
        this.emit('optimization-needed', {
          action: rule.action,
          utilization: this.metrics.resourceUtilization / 100,
          threshold: rule.threshold,
          bottlenecks,
          priority: rule.priority,
        });

        // Only execute highest priority action
        break;
      }
    }
  }

  async executeTask<T>(
    taskName: string,
    task: () => Promise<T>,
    options: {
      priority?: number;
      category?: string;
      maxRetries?: number;
    } = {}
  ): Promise<T> {
    const {
      priority = this.config.taskPriorities.default,
      category = 'default',
      maxRetries = 3,
    } = options;

    const metadata: TaskMetadata = {
      priority,
      startTime: Date.now(),
      attempts: 0,
      maxRetries,
      category,
    };

    this.taskMetadata.set(taskName, metadata);

    if (this.taskQueue.size >= this.config.maxConcurrentTasks && !this.isProcessing) {
      this.emit('queue-full', {
        size: this.taskQueue.size,
        waitTime: this.calculateAverageWaitTime(),
      });
      await this.waitForQueueSpace();
    }

    const startTime = Date.now();
    this.isProcessing = true;

    try {
      const taskPromise = task();
      this.taskQueue.set(taskName, taskPromise);

      const result = await taskPromise;
      this.updateMetrics(taskName, Date.now() - startTime);
      this.metrics.throughput.successfulTasks++;
      return result;
    } catch (error) {
      metadata.attempts++;
      metadata.lastError = error as Error;

      if (metadata.attempts < metadata.maxRetries) {
        // Retry with exponential backoff
        const backoff = Math.min(1000 * Math.pow(2, metadata.attempts - 1), 30000);
        await new Promise(resolve => setTimeout(resolve, backoff));
        return this.executeTask(taskName, task, options);
      }

      this.updateErrorMetrics(taskName);
      this.metrics.throughput.failedTasks++;
      throw error;
    } finally {
      this.taskQueue.delete(taskName);
      this.taskMetadata.delete(taskName);
      this.isProcessing = this.taskQueue.size > 0;
      this.updateThroughputMetrics();
    }
  }

  private updateThroughputMetrics(): void {
    const totalTasks = this.metrics.throughput.successfulTasks + this.metrics.throughput.failedTasks;
    const elapsedSeconds = (Date.now() - this.startTime) / 1000;
    this.metrics.throughput.tasksPerSecond = totalTasks / elapsedSeconds;
  }

  private updateMetrics(taskName: string, executionTime: number): void {
    this.metrics.taskExecutionTimes[taskName] = executionTime;
    this.metrics.resourceUtilization = (this.taskQueue.size / this.config.maxConcurrentTasks) * 100;
    
    // Update quality metrics
    this.metrics.qualityMetrics.performanceScore = this.calculatePerformanceScore();
    this.metrics.qualityMetrics.reliability = this.calculateReliability();
    this.metrics.qualityMetrics.availability = this.calculateAvailability();

    // Update cost metrics
    this.updateCostMetrics();
  }

  private updateCostMetrics(): void {
    // Calculate costs based on resource usage
    const cpuCost = this.metrics.resourceUtilization * 0.01; // Cost per CPU percentage
    const memoryCost = this.metrics.costMetrics.memoryUsage * 0.001; // Cost per MB
    const networkCost = this.metrics.costMetrics.networkUsage * 0.0001; // Cost per KB

    this.metrics.costMetrics.computeCost = cpuCost + memoryCost;
    this.metrics.costMetrics.resourceCost = networkCost;
  }

  private updateErrorMetrics(taskName: string): void {
    const currentErrors = this.metrics.errorRates[taskName] ?? 0;
    const totalExecutions = Object.keys(this.metrics.taskExecutionTimes).length;
    this.metrics.errorRates[taskName] = (currentErrors * totalExecutions + 1) / (totalExecutions + 1);
    this.metrics.qualityMetrics.successRate = this.calculateSuccessRate();
  }

  private calculatePerformanceScore(): number {
    const executionTimes = Object.values(this.metrics.taskExecutionTimes);
    const totalTimes = executionTimes.reduce((a, b) => a + b, 0);
    const count = executionTimes.length || 1;
    const avgExecutionTime = totalTimes / count;

    // Consider multiple factors for performance score
    const timeScore = Math.max(0, 100 - (avgExecutionTime / 1000));
    const utilizationScore = Math.max(0, 100 - this.metrics.resourceUtilization);
    const errorScore = this.metrics.qualityMetrics.successRate;

    return (timeScore + utilizationScore + errorScore) / 3;
  }

  private calculateSuccessRate(): number {
    const totalErrors = Object.values(this.metrics.errorRates).reduce((a, b) => a + b, 0);
    return Math.max(0, 100 - (totalErrors * 100));
  }

  private calculateReliability(): number {
    const totalTasks = this.metrics.throughput.successfulTasks + this.metrics.throughput.failedTasks;
    if (totalTasks === 0) return 100;
    return (this.metrics.throughput.successfulTasks / totalTasks) * 100;
  }

  private calculateAvailability(): number {
    const totalTime = Date.now() - this.startTime;
    const downtime = Array.from(this.taskMetadata.values())
      .filter(metadata => metadata.lastError)
      .reduce((total, metadata) => total + (metadata.attempts * 1000), 0);
    
    return Math.max(0, 100 - ((downtime / totalTime) * 100));
  }

  private async waitForQueueSpace(): Promise<void> {
    return new Promise(resolve => {
      const checkQueue = (): void => {
        if (this.taskQueue.size < this.config.maxConcurrentTasks) {
          resolve();
        } else {
          setTimeout(checkQueue, 100);
        }
      };
      checkQueue();
    });
  }

  getMetrics(): OperationalMetrics {
    return { ...this.metrics };
  }

  getTaskMetadata(taskName: string): TaskMetadata | undefined {
    return this.taskMetadata.get(taskName);
  }

  cleanup(): void {
    clearInterval(this.bottleneckDetector);
    this.removeAllListeners();
    this.taskQueue.clear();
    this.taskMetadata.clear();
    this.adaptiveThresholds.clear();
    this.lastOptimizations.clear();
  }
} 
