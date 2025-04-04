import { OperationsManager } from './operations_manager';
import { SystemMonitor } from './system_monitor';
import { EventEmitter } from 'events';

export interface OptimizationStrategy {
  name: string;
  condition: (metrics: any) => boolean;
  action: () => Promise<void>;
  priority: number;
  cooldown: number;
  lastExecuted?: number;
  successRate: number;
  executionCount: number;
}

interface OptimizationResult {
  strategy: string;
  success: boolean;
  metrics: {
    before: any;
    after: any;
  };
  timestamp: number;
  duration: number;
}

interface MLModel {
  weights: number[];
  bias: number;
  learningRate: number;
}

interface OptimizationData {
  action: string;
  utilization: number;
  threshold: number;
}

export class PerformanceOptimizer extends EventEmitter {
  private readonly operationsManager: OperationsManager;
  private readonly systemMonitor: SystemMonitor;
  private readonly strategies: OptimizationStrategy[];
  private readonly optimizationHistory: OptimizationResult[] = [];
  private readonly mlModel: MLModel = {
    weights: [0.3, 0.3, 0.4], // CPU, Memory, Network weights
    bias: 0,
    learningRate: 0.01,
  };
  private isOptimizing = false;
  private readonly maxHistorySize: number = 1000;
  private readonly adaptiveThresholds = new Map<string, number>();

  constructor(
    operationsManager: OperationsManager,
    systemMonitor: SystemMonitor,
    config?: {
      maxHistorySize?: number;
      learningRate?: number;
      initialWeights?: number[];
    }
  ) {
    super();
    this.operationsManager = operationsManager;
    this.systemMonitor = systemMonitor;
    
    if (config) {
      this.maxHistorySize = config.maxHistorySize ?? this.maxHistorySize;
      this.mlModel.learningRate = config.learningRate ?? this.mlModel.learningRate;
      this.mlModel.weights = config.initialWeights ?? this.mlModel.weights;
    }

    this.strategies = this.initializeStrategies();
    this.initializeOptimizer();
  }

  private initializeStrategies(): OptimizationStrategy[] {
    return [
      {
        name: 'Memory Optimization',
        condition: (metrics) => metrics.memory.percentage > 80,
        action: this.optimizeMemory.bind(this),
        priority: 1,
        cooldown: 60000, // 1 minute
        successRate: 1,
        executionCount: 0,
      },
      {
        name: 'CPU Optimization',
        condition: (metrics) => metrics.cpu.usage > 70,
        action: this.optimizeCPU.bind(this),
        priority: 2,
        cooldown: 30000, // 30 seconds
        successRate: 1,
        executionCount: 0,
      },
      {
        name: 'Network Optimization',
        condition: (metrics) => metrics.network && metrics.network.latency > 100,
        action: this.optimizeNetwork.bind(this),
        priority: 3,
        cooldown: 120000, // 2 minutes
        successRate: 1,
        executionCount: 0,
      },
      {
        name: 'Task Queue Optimization',
        condition: (metrics) => metrics.taskQueue?.size > 10,
        action: this.optimizeTaskQueue.bind(this),
        priority: 4,
        cooldown: 45000, // 45 seconds
        successRate: 1,
        executionCount: 0,
      },
      {
        name: 'Predictive Scaling',
        condition: (metrics) => this.predictiveScalingNeeded(metrics),
        action: this.performPredictiveScaling.bind(this),
        priority: 5,
        cooldown: 300000, // 5 minutes
        successRate: 1,
        executionCount: 0,
      },
    ];
  }

  private initializeOptimizer(): void {
    // Listen for system metrics updates
    this.systemMonitor.on('metrics-update', this.handleMetricsUpdate.bind(this));

    // Listen for operations events
    this.operationsManager.on('bottleneck-detected', this.handleBottleneck.bind(this));
    this.operationsManager.on('optimization-needed', this.handleOptimizationNeeded.bind(this));

    // Initialize adaptive thresholds
    this.initializeAdaptiveThresholds();

    // Start ML model training
    setInterval(() => {
      this.trainModel();
    }, 300000); // Train every 5 minutes
  }

  private initializeAdaptiveThresholds(): void {
    this.adaptiveThresholds.set('cpu', 70);
    this.adaptiveThresholds.set('memory', 80);
    this.adaptiveThresholds.set('network', 100);
    
    // Adjust thresholds periodically based on system performance
    setInterval(() => {
      this.updateAdaptiveThresholds();
    }, 60000);
  }

  private updateAdaptiveThresholds(): void {
    const predictions = this.systemMonitor.getPredictions();

    this.adaptiveThresholds.forEach((threshold, metric) => {
      let adjustment = 0;

      // Adjust based on current performance and predictions
      if (predictions.cpuTrend === 'increasing' && metric === 'cpu') {
        adjustment -= 5;
      } else if (predictions.performanceIssues.length === 0) {
        adjustment += 2;
      }

      // Consider historical optimization success
      const recentOptimizations = this.getRecentOptimizations(metric, 5);
      const successRate = this.calculateSuccessRate(recentOptimizations);
      
      if (successRate > 0.8) {
        adjustment += 3;
      } else if (successRate < 0.5) {
        adjustment -= 3;
      }

      // Apply adjustment with bounds
      const newThreshold = Math.max(50, Math.min(95, threshold + adjustment));
      this.adaptiveThresholds.set(metric, newThreshold);
    });
  }

  private async handleMetricsUpdate(metrics: any): Promise<void> {
    if (this.isOptimizing) return;

    const applicableStrategies = this.strategies
      .filter(strategy => {
        const threshold = this.adaptiveThresholds.get(strategy.name.toLowerCase().split(' ')[0]);
        return strategy.condition(metrics) && this.canExecuteStrategy(strategy, threshold);
      })
      .sort((a, b) => {
        // Sort by priority and success rate
        const priorityDiff = a.priority - b.priority;
        if (priorityDiff !== 0) return priorityDiff;
        return b.successRate - a.successRate;
      });

    if (applicableStrategies.length > 0) {
      await this.executeOptimizationStrategies(applicableStrategies, metrics);
    }
  }

  private canExecuteStrategy(
    strategy: OptimizationStrategy,
    threshold?: number
  ): boolean {
    if (!strategy.lastExecuted) return true;

    const timeSinceLastExecution = Date.now() - strategy.lastExecuted;
    return timeSinceLastExecution >= strategy.cooldown;
  }

  private async executeOptimizationStrategies(
    strategies: OptimizationStrategy[],
    metrics: any
  ): Promise<void> {
    this.isOptimizing = true;
    const startTime = Date.now();

    try {
      for (const strategy of strategies) {
        this.emit('optimization-started', strategy.name);
        
        const beforeMetrics = { ...metrics };
        const success = await this.executeStrategyWithRetry(strategy);
        const afterMetrics = this.systemMonitor.getMetrics();

        this.recordOptimizationResult({
          strategy: strategy.name,
          success,
          metrics: {
            before: beforeMetrics,
            after: afterMetrics,
          },
          timestamp: Date.now(),
          duration: Date.now() - startTime,
        });

        this.updateStrategyStats(strategy, success);
        this.emit('optimization-completed', strategy.name);
      }
    } finally {
      this.isOptimizing = false;
    }
  }

  private async executeStrategyWithRetry(
    strategy: OptimizationStrategy,
    maxRetries = 3
  ): Promise<boolean> {
    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        await strategy.action();
        strategy.lastExecuted = Date.now();
        return true;
      } catch (error) {
        attempts++;
        if (attempts === maxRetries) {
          this.emit('optimization-error', {
            strategy: strategy.name,
            error,
            attempts,
          });
          return false;
        }
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.min(1000 * Math.pow(2, attempts), 10000))
        );
      }
    }
    return false;
  }

  private recordOptimizationResult(result: OptimizationResult): void {
    this.optimizationHistory.push(result);
    if (this.optimizationHistory.length > this.maxHistorySize) {
      this.optimizationHistory.shift();
    }
  }

  private updateStrategyStats(strategy: OptimizationStrategy, success: boolean): void {
    strategy.executionCount++;
    strategy.successRate = (
      (strategy.successRate * (strategy.executionCount - 1) + (success ? 1 : 0)) /
      strategy.executionCount
    );
  }

  private getRecentOptimizations(
    metric: string,
    count: number
  ): OptimizationResult[] {
    return this.optimizationHistory
      .filter(result => result.strategy.toLowerCase().includes(metric))
      .slice(-count);
  }

  private calculateSuccessRate(optimizations: OptimizationResult[]): number {
    if (optimizations.length === 0) return 1;
    return optimizations.filter(opt => opt.success).length / optimizations.length;
  }

  private trainModel(): void {
    if (this.optimizationHistory.length < 10) return;

    const trainingData = this.optimizationHistory.map(result => ({
      input: [
        result.metrics.before.cpu.usage / 100,
        result.metrics.before.memory.percentage / 100,
        result.metrics.before.network.latency / 1000,
      ],
      output: result.success ? 1 : 0,
    }));

    // Simple gradient descent
    for (const data of trainingData) {
      const prediction = this.predict(data.input);
      const error = data.output - prediction;

      // Update weights
      for (let i = 0; i < this.mlModel.weights.length; i++) {
        this.mlModel.weights[i] += 
          this.mlModel.learningRate * error * data.input[i];
      }

      // Update bias
      this.mlModel.bias += this.mlModel.learningRate * error;
    }
  }

  private predict(input: number[]): number {
    let sum = this.mlModel.bias;
    for (let i = 0; i < this.mlModel.weights.length; i++) {
      sum += input[i] * this.mlModel.weights[i];
    }
    return 1 / (1 + Math.exp(-sum)); // Sigmoid activation
  }

  private predictiveScalingNeeded(metrics: any): boolean {
    const predictions = this.systemMonitor.getPredictions();
    if (!predictions) return false;

    // Check if any resource is predicted to exceed thresholds
    return (
      predictions.cpuTrend === 'increasing' ||
      predictions.memoryExhaustion !== undefined ||
      predictions.performanceIssues.length > 0
    );
  }

  private async optimizeMemory(): Promise<void> {
    // Implement memory optimization logic
    global.gc?.(); // Trigger garbage collection if available
    
    // Additional memory optimization strategies
    await this.operationsManager.executeTask('memory-optimization', async () => {
      // Implement custom memory optimization logic
      return Promise.resolve();
    });
  }

  private async optimizeCPU(): Promise<void> {
    // Implement CPU optimization logic
    await this.operationsManager.executeTask('cpu-optimization', async () => {
      // Example: Throttle non-critical tasks
      return Promise.resolve();
    });
  }

  private async optimizeNetwork(): Promise<void> {
    // Implement network optimization logic
    await this.operationsManager.executeTask('network-optimization', async () => {
      // Example: Implement request batching or caching
      return Promise.resolve();
    });
  }

  private async optimizeTaskQueue(): Promise<void> {
    // Implement task queue optimization
    await this.operationsManager.executeTask('queue-optimization', async () => {
      // Example: Reorder tasks based on priority
      return Promise.resolve();
    });
  }

  private async performPredictiveScaling(): Promise<void> {
    const predictions = this.systemMonitor.getPredictions();
    const metrics = this.systemMonitor.getMetrics();
    
    await this.operationsManager.executeTask('predictive-scaling', async () => {
      // Implement scaling logic based on predictions
      this.calculateScalingFactor(metrics, predictions); // Calculate and use the scaling factor
      return Promise.resolve();
    });
  }

  private calculateScalingFactor(metrics: any, predictions: any): number {
    // Implement scaling factor calculation based on metrics and predictions
    const currentLoad = metrics.cpu.usage / 100;
    const memoryPressure = metrics.memory.percentage / 100;
    const networkLoad = metrics.network.latency / 1000;

    const prediction = this.predict([currentLoad, memoryPressure, networkLoad]);
    return 1 + (prediction * 0.5); // Scale up to 50% based on prediction
  }

  private async handleBottleneck(bottlenecks: string[]): Promise<void> {
    this.emit('bottleneck-detected', bottlenecks);
    
    // Prioritize bottleneck resolution
    const relevantStrategies = this.strategies.filter(strategy =>
      bottlenecks.some(bottleneck => 
        bottleneck.toLowerCase().includes(strategy.name.toLowerCase().split(' ')[0])
      )
    );

    if (relevantStrategies.length > 0) {
      await this.executeOptimizationStrategies(
        relevantStrategies,
        this.systemMonitor.getMetrics()
      );
    }
  }

  private async handleOptimizationNeeded(data: OptimizationData): Promise<void> {
    if (data.action === 'scale') {
      this.emit('scale');
      const strategy = this.strategies.find(s => s.name.toLowerCase().includes(data.action.toLowerCase()));
      if (strategy) {
        await this.executeOptimizationStrategies([strategy], this.systemMonitor.getMetrics());
      }
    } else {
      const strategy = this.strategies.find(s => s.name.toLowerCase().includes(data.action.toLowerCase()));
      if (strategy) {
        await this.executeOptimizationStrategies([strategy], this.systemMonitor.getMetrics());
      }
    }
  }

  getOptimizationStatus(): Record<string, unknown> {
    return {
      isOptimizing: this.isOptimizing,
      systemMetrics: this.systemMonitor.getMetrics(),
      operationalMetrics: this.operationsManager.getMetrics(),
      activeStrategies: this.strategies
        .filter(s => s.condition(this.systemMonitor.getMetrics()))
        .map(s => ({
          name: s.name,
          successRate: s.successRate,
          lastExecuted: s.lastExecuted,
          executionCount: s.executionCount,
        })),
      adaptiveThresholds: Object.fromEntries(this.adaptiveThresholds),
      mlModelStatus: {
        weights: this.mlModel.weights,
        bias: this.mlModel.bias,
        recentAccuracy: this.calculateRecentModelAccuracy(),
      },
    };
  }

  private calculateRecentModelAccuracy(): number {
    const recentResults = this.optimizationHistory.slice(-100);
    if (recentResults.length === 0) return 1;

    let correct = 0;
    for (const result of recentResults) {
      const input = [
        result.metrics.before.cpu.usage / 100,
        result.metrics.before.memory.percentage / 100,
        result.metrics.before.network.latency / 1000,
      ];
      const prediction = this.predict(input) >= 0.5;
      if (prediction === result.success) correct++;
    }

    return correct / recentResults.length;
  }

  getOptimizationHistory(): OptimizationResult[] {
    return [...this.optimizationHistory];
  }

  cleanup(): void {
    this.systemMonitor.removeAllListeners();
    this.operationsManager.removeAllListeners();
    this.removeAllListeners();
  }
} 