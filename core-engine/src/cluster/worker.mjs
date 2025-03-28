import { logger } from '../../config/logger.mjs';
import { AIOptimizer } from '../ai/optimizer.mjs';
import { PerformanceMonitor } from '../performance/monitor.mjs';
import { SecurityManager } from '../security/manager.mjs';

export class WorkerManager {
  constructor() {
    this.initialized = false;
    this.aiOptimizer = null;
    this.performanceMonitor = null;
    this.securityManager = null;
    this.currentTask = null;
    this.metrics = {
      tasksCompleted: 0,
      tasksFailed: 0,
      averageExecutionTime: 0,
      lastUpdate: null,
    };
  }

  /**
   * Initialize worker manager
   */
  async initialize() {
    try {
      // Initialize components
      this.aiOptimizer = new AIOptimizer(process.env.OPENAI_API_KEY);
      this.performanceMonitor = new PerformanceMonitor();
      this.securityManager = new SecurityManager();

      await Promise.all([
        this.aiOptimizer.initialize(),
        this.performanceMonitor.initialize(),
        this.securityManager.initialize(),
      ]);

      this.initialized = true;
      logger.info('✅ Worker manager initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize worker manager:', error);
      throw error;
    }
  }

  /**
   * Process task
   */
  async processTask(task, options = {}) {
    try {
      if (!this.initialized) await this.initialize();

      this.currentTask = task;
      const operationId = this.performanceMonitor.startMonitoring('task-processing');

      try {
        // Validate task security
        await this.securityManager.validateCode(task.code);

        // Process task based on type
        let result;
        switch (task.type) {
          case 'code-generation':
            result = await this._processCodeGeneration(task, options);
            break;
          case 'optimization':
            result = await this._processOptimization(task, options);
            break;
          case 'analysis':
            result = await this._processAnalysis(task, options);
            break;
          default:
            throw new Error(`Unknown task type: ${task.type}`);
        }

        // Update metrics
        this._updateMetrics(true);

        return result;
      } finally {
        const performanceResults = this.performanceMonitor.stopMonitoring(operationId);
        this._updatePerformanceMetrics(performanceResults);
      }
    } catch (error) {
      this._updateMetrics(false);
      logger.error('❌ Task processing failed:', error);
      throw error;
    }
  }

  /**
   * Get worker metrics
   */
  async getMetrics() {
    return {
      initialized: this.initialized,
      currentTask: this.currentTask,
      metrics: this.metrics,
      lastUpdate: new Date().toISOString(),
    };
  }

  /**
   * Update worker settings
   */
  async updateSettings(settings) {
    try {
      if (settings.ai) {
        await this.aiOptimizer.updateSettings(settings.ai);
      }
      if (settings.performance) {
        await this.performanceMonitor.updateThresholds(settings.performance);
      }
      if (settings.security) {
        await this.securityManager.updateSettings(settings.security);
      }
      logger.info('✅ Worker settings updated');
    } catch (error) {
      logger.error('❌ Failed to update worker settings:', error);
      throw error;
    }
  }

  // Private methods

  async _processCodeGeneration(task, options) {
    const result = await this.aiOptimizer.generateCode(task.description, options);
    
    // Validate generated code
    await this.securityManager.validateCode(result);
    
    // Analyze performance
    const performanceAnalysis = await this.performanceMonitor.analyzePerformance(result);
    
    return {
      code: result,
      performance: performanceAnalysis,
      security: {
        validated: true,
        score: await this.securityManager.calculateSecurityScore(result),
      },
    };
  }

  async _processOptimization(task, options) {
    // Optimize code
    const optimizedCode = await this.aiOptimizer.optimizeCode(task.code, options);
    
    // Validate optimized code
    await this.securityManager.validateCode(optimizedCode);
    
    // Analyze performance
    const performanceAnalysis = await this.performanceMonitor.analyzePerformance(optimizedCode);
    
    return {
      originalCode: task.code,
      optimizedCode,
      performance: performanceAnalysis,
      security: {
        validated: true,
        score: await this.securityManager.calculateSecurityScore(optimizedCode),
      },
    };
  }

  async _processAnalysis(task, options) {
    // Perform code analysis
    const aiAnalysis = await this.aiOptimizer.analyzeCode(task.code);
    const performanceAnalysis = await this.performanceMonitor.analyzePerformance(task.code);
    const securityScore = await this.securityManager.calculateSecurityScore(task.code);
    
    return {
      aiAnalysis,
      performance: performanceAnalysis,
      security: {
        score: securityScore,
        validated: true,
      },
    };
  }

  _updateMetrics(success) {
    if (success) {
      this.metrics.tasksCompleted++;
    } else {
      this.metrics.tasksFailed++;
    }
    this.metrics.lastUpdate = new Date().toISOString();
  }

  _updatePerformanceMetrics(results) {
    const totalTasks = this.metrics.tasksCompleted + this.metrics.tasksFailed;
    const currentAverage = this.metrics.averageExecutionTime;
    const newExecutionTime = results.executionTime;

    this.metrics.averageExecutionTime = 
      (currentAverage * totalTasks + newExecutionTime) / (totalTasks + 1);
  }
} 