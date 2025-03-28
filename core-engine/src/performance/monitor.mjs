import { logger } from '../../config/logger.mjs';
import { performance } from 'perf_hooks';

export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.thresholds = {
      executionTime: 1000, // ms
      memoryUsage: 100 * 1024 * 1024, // 100MB
      cpuUsage: 80, // percentage
    };
    this.initialized = false;
  }

  /**
   * Initialize performance monitor
   */
  async initialize() {
    try {
      this.initialized = true;
      logger.info('✅ Performance monitor initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize performance monitor:', error);
      throw error;
    }
  }

  /**
   * Start monitoring performance
   */
  startMonitoring(operationId) {
    if (!this.initialized) {
      throw new Error('Performance monitor not initialized');
    }

    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    const startCpu = process.cpuUsage();

    this.metrics.set(operationId, {
      startTime,
      startMemory,
      startCpu,
      measurements: [],
    });

    return operationId;
  }

  /**
   * Record performance measurement
   */
  recordMeasurement(operationId, measurement) {
    const metrics = this.metrics.get(operationId);
    if (!metrics) {
      throw new Error(`No metrics found for operation ${operationId}`);
    }

    metrics.measurements.push({
      ...measurement,
      timestamp: performance.now(),
    });
  }

  /**
   * Stop monitoring and get results
   */
  stopMonitoring(operationId) {
    const metrics = this.metrics.get(operationId);
    if (!metrics) {
      throw new Error(`No metrics found for operation ${operationId}`);
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    const endCpu = process.cpuUsage();

    const results = {
      executionTime: endTime - metrics.startTime,
      memoryUsage: {
        heapUsed: endMemory.heapUsed - metrics.startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - metrics.startMemory.heapTotal,
        external: endMemory.external - metrics.startMemory.external,
      },
      cpuUsage: {
        user: endCpu.user - metrics.startCpu.user,
        system: endCpu.system - metrics.startCpu.system,
      },
      measurements: metrics.measurements,
    };

    this.metrics.delete(operationId);
    return this._analyzeResults(results);
  }

  /**
   * Get performance metrics
   */
  async getMetrics() {
    return {
      initialized: this.initialized,
      activeOperations: this.metrics.size,
      thresholds: this.thresholds,
      lastUpdate: new Date().toISOString(),
    };
  }

  /**
   * Update performance thresholds
   */
  async updateThresholds(thresholds) {
    this.thresholds = {
      ...this.thresholds,
      ...thresholds,
    };
    logger.info('✅ Performance thresholds updated');
  }

  /**
   * Analyze code performance
   */
  async analyzePerformance(code) {
    const operationId = this.startMonitoring('code-analysis');
    
    try {
      // Measure code complexity
      const complexity = this._measureComplexity(code);
      
      // Measure potential bottlenecks
      const bottlenecks = this._identifyBottlenecks(code);
      
      // Measure memory patterns
      const memoryPatterns = this._analyzeMemoryPatterns(code);
      
      // Record measurements
      this.recordMeasurement(operationId, {
        type: 'complexity',
        value: complexity,
      });
      
      this.recordMeasurement(operationId, {
        type: 'bottlenecks',
        value: bottlenecks,
      });
      
      this.recordMeasurement(operationId, {
        type: 'memory',
        value: memoryPatterns,
      });
      
      return this.stopMonitoring(operationId);
    } catch (error) {
      this.metrics.delete(operationId);
      throw error;
    }
  }

  // Private methods

  _analyzeResults(results) {
    const analysis = {
      ...results,
      performanceScore: this._calculatePerformanceScore(results),
      recommendations: this._generateRecommendations(results),
      warnings: this._generateWarnings(results),
    };

    return analysis;
  }

  _calculatePerformanceScore(results) {
    const weights = {
      executionTime: 0.4,
      memoryUsage: 0.3,
      cpuUsage: 0.3,
    };

    const executionScore = Math.max(
      0,
      1 - results.executionTime / this.thresholds.executionTime
    );

    const memoryScore = Math.max(
      0,
      1 - results.memoryUsage.heapUsed / this.thresholds.memoryUsage
    );

    const cpuScore = Math.max(
      0,
      1 - (results.cpuUsage.user + results.cpuUsage.system) / this.thresholds.cpuUsage
    );

    return (
      executionScore * weights.executionTime +
      memoryScore * weights.memoryUsage +
      cpuScore * weights.cpuUsage
    );
  }

  _generateRecommendations(results) {
    const recommendations = [];

    if (results.executionTime > this.thresholds.executionTime * 0.8) {
      recommendations.push('Consider optimizing execution time');
    }

    if (results.memoryUsage.heapUsed > this.thresholds.memoryUsage * 0.8) {
      recommendations.push('Consider optimizing memory usage');
    }

    if (results.cpuUsage.user + results.cpuUsage.system > this.thresholds.cpuUsage * 0.8) {
      recommendations.push('Consider optimizing CPU usage');
    }

    return recommendations;
  }

  _generateWarnings(results) {
    const warnings = [];

    if (results.executionTime > this.thresholds.executionTime) {
      warnings.push('Execution time exceeds threshold');
    }

    if (results.memoryUsage.heapUsed > this.thresholds.memoryUsage) {
      warnings.push('Memory usage exceeds threshold');
    }

    if (results.cpuUsage.user + results.cpuUsage.system > this.thresholds.cpuUsage) {
      warnings.push('CPU usage exceeds threshold');
    }

    return warnings;
  }

  _measureComplexity(code) {
    // Implement code complexity measurement
    const lines = code.split('\n');
    let complexity = 0;

    // Count control structures
    const controlStructures = [
      'if',
      'else',
      'for',
      'while',
      'do',
      'switch',
      'catch',
      'finally',
    ];

    lines.forEach(line => {
      controlStructures.forEach(structure => {
        if (line.includes(structure)) {
          complexity++;
        }
      });
    });

    return complexity;
  }

  _identifyBottlenecks(code) {
    // Implement bottleneck identification
    const bottlenecks = [];

    // Check for nested loops
    const nestedLoops = code.match(/for\s*\([^)]*\)\s*{[^}]*for\s*\([^)]*\)/g);
    if (nestedLoops) {
      bottlenecks.push('Nested loops detected');
    }

    // Check for large data structures
    const largeArrays = code.match(/new Array\(\d{4,}\)/g);
    if (largeArrays) {
      bottlenecks.push('Large array allocations detected');
    }

    // Check for synchronous operations
    const syncOps = code.match(/fs\.readFileSync|fs\.writeFileSync/g);
    if (syncOps) {
      bottlenecks.push('Synchronous file operations detected');
    }

    return bottlenecks;
  }

  _analyzeMemoryPatterns(code) {
    // Implement memory pattern analysis
    const patterns = {
      memoryLeaks: [],
      inefficientAllocations: [],
      garbageCollection: [],
    };

    // Check for potential memory leaks
    const eventListeners = code.match(/addEventListener/g);
    if (eventListeners && !code.includes('removeEventListener')) {
      patterns.memoryLeaks.push('Potential event listener memory leak');
    }

    // Check for inefficient allocations
    const arrayAllocations = code.match(/new Array\(\d+\)/g);
    if (arrayAllocations) {
      patterns.inefficientAllocations.push('Fixed-size array allocations');
    }

    // Check for garbage collection patterns
    const gcPatterns = code.match(/global\.gc|process\.gc/g);
    if (gcPatterns) {
      patterns.garbageCollection.push('Manual garbage collection calls');
    }

    return patterns;
  }
} 