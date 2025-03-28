import { logger } from '../../config/logger.mjs';
import cluster from 'cluster';
import { cpus } from 'os';

export class ClusterManager {
  constructor() {
    this.workers = new Map();
    this.initialized = false;
    this.options = {
      numWorkers: cpus().length,
      autoRestart: true,
      maxRestarts: 3,
      workerTimeout: 30000,
    };
  }

  /**
   * Initialize cluster manager
   */
  async initialize() {
    try {
      if (cluster.isPrimary) {
        await this._initializePrimary();
      } else {
        await this._initializeWorker();
      }
      this.initialized = true;
      logger.info('✅ Cluster manager initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize cluster manager:', error);
      throw error;
    }
  }

  /**
   * Start cluster with specified options
   */
  async start(options = {}) {
    try {
      if (!this.initialized) await this.initialize();

      this.options = {
        ...this.options,
        ...options,
      };

      if (cluster.isPrimary) {
        await this._startWorkers();
      }

      logger.info('✅ Cluster started');
    } catch (error) {
      logger.error('❌ Failed to start cluster:', error);
      throw error;
    }
  }

  /**
   * Stop cluster
   */
  async stop() {
    try {
      if (cluster.isPrimary) {
        await this._stopWorkers();
      }
      logger.info('✅ Cluster stopped');
    } catch (error) {
      logger.error('❌ Failed to stop cluster:', error);
      throw error;
    }
  }

  /**
   * Distribute task across workers
   */
  async distributeTask(task, options = {}) {
    try {
      if (!cluster.isPrimary) {
        throw new Error('Task distribution can only be done from primary process');
      }

      const worker = this._getAvailableWorker();
      if (!worker) {
        throw new Error('No available workers');
      }

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Task execution timeout'));
        }, this.options.workerTimeout);

        worker.send({ task, options }, (error) => {
          if (error) {
            clearTimeout(timeout);
            reject(error);
          }
        });

        worker.once('message', (result) => {
          clearTimeout(timeout);
          resolve(result);
        });
      });
    } catch (error) {
      logger.error('❌ Failed to distribute task:', error);
      throw error;
    }
  }

  /**
   * Get cluster metrics
   */
  async getMetrics() {
    return {
      initialized: this.initialized,
      isPrimary: cluster.isPrimary,
      workerCount: this.workers.size,
      options: this.options,
      lastUpdate: new Date().toISOString(),
    };
  }

  /**
   * Update cluster settings
   */
  async updateSettings(settings) {
    try {
      this.options = {
        ...this.options,
        ...settings,
      };

      if (cluster.isPrimary) {
        await this._reconfigureWorkers();
      }

      logger.info('✅ Cluster settings updated');
    } catch (error) {
      logger.error('❌ Failed to update cluster settings:', error);
      throw error;
    }
  }

  // Private methods

  async _initializePrimary() {
    cluster.on('fork', (worker) => {
      this.workers.set(worker.id, {
        process: worker,
        restarts: 0,
        status: 'active',
      });
      logger.info(`✅ Worker ${worker.id} forked`);
    });

    cluster.on('exit', (worker, code, signal) => {
      const workerInfo = this.workers.get(worker.id);
      if (workerInfo) {
        workerInfo.status = 'exited';
        workerInfo.exitCode = code;
        workerInfo.exitSignal = signal;

        if (this.options.autoRestart && workerInfo.restarts < this.options.maxRestarts) {
          workerInfo.restarts++;
          workerInfo.status = 'restarting';
          cluster.fork();
        } else {
          this.workers.delete(worker.id);
          logger.warn(`⚠️ Worker ${worker.id} exited permanently`);
        }
      }
    });

    cluster.on('message', (worker, message) => {
      logger.debug(`📨 Message from worker ${worker.id}:`, message);
    });
  }

  async _initializeWorker() {
    process.on('message', async (message) => {
      try {
        const { task, options } = message;
        const result = await this._executeTask(task, options);
        process.send(result);
      } catch (error) {
        process.send({ error: error.message });
      }
    });
  }

  async _startWorkers() {
    for (let i = 0; i < this.options.numWorkers; i++) {
      cluster.fork();
    }
  }

  async _stopWorkers() {
    for (const [id, worker] of this.workers) {
      try {
        worker.process.kill();
        this.workers.delete(id);
      } catch (error) {
        logger.error(`❌ Failed to stop worker ${id}:`, error);
      }
    }
  }

  async _reconfigureWorkers() {
    const currentCount = this.workers.size;
    const targetCount = this.options.numWorkers;

    if (currentCount < targetCount) {
      // Add workers
      for (let i = currentCount; i < targetCount; i++) {
        cluster.fork();
      }
    } else if (currentCount > targetCount) {
      // Remove workers
      const workersToRemove = Array.from(this.workers.entries())
        .slice(targetCount)
        .map(([id]) => id);

      for (const id of workersToRemove) {
        const worker = this.workers.get(id);
        if (worker) {
          worker.process.kill();
          this.workers.delete(id);
        }
      }
    }
  }

  _getAvailableWorker() {
    for (const [id, worker] of this.workers) {
      if (worker.status === 'active') {
        return worker.process;
      }
    }
    return null;
  }

  async _executeTask(task, options) {
    // Implement task execution logic
    switch (task.type) {
      case 'code-generation':
        return this._executeCodeGeneration(task.data, options);
      case 'optimization':
        return this._executeOptimization(task.data, options);
      case 'analysis':
        return this._executeAnalysis(task.data, options);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  async _executeCodeGeneration(data, options) {
    // Implement code generation task
    return {
      success: true,
      result: 'Generated code',
      metrics: {
        executionTime: 100,
        memoryUsage: 50 * 1024 * 1024,
      },
    };
  }

  async _executeOptimization(data, options) {
    // Implement optimization task
    return {
      success: true,
      result: 'Optimized code',
      metrics: {
        executionTime: 150,
        memoryUsage: 75 * 1024 * 1024,
      },
    };
  }

  async _executeAnalysis(data, options) {
    // Implement analysis task
    return {
      success: true,
      result: 'Analysis results',
      metrics: {
        executionTime: 200,
        memoryUsage: 100 * 1024 * 1024,
      },
    };
  }
} 