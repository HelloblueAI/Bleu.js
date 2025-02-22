//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.

import cluster from 'cluster';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import winston from 'winston';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

class WorkerManager {
  constructor() {
    this.numCPUs = os.cpus().length;
    this.workers = new Map();
    this.restartAttempts = new Map();
    this.MAX_RESTART_ATTEMPTS = 5;
    this.RESTART_DELAY = 5000; // 5 seconds
  }

  start() {
    if (cluster.isPrimary) {
      logger.info(`🧩 Primary process [PID: ${process.pid}] is running`);
      this.setupExitHandlers();
      this.initializeWorkers();
    } else {
      this.startWorker();
    }
  }

  initializeWorkers() {
    for (let i = 0; i < this.numCPUs; i++) {
      this.createWorker();
    }

    cluster.on('exit', (worker, code, signal) => {
      this.handleWorkerExit(worker, code, signal);
    });

    cluster.on('message', (worker, message) => {
      this.handleWorkerMessage(worker, message);
    });
  }

  createWorker() {
    const worker = cluster.fork();
    this.workers.set(worker.id, {
      pid: worker.process.pid,
      startTime: Date.now(),
    });

    logger.info(`🚀 Forked Worker ${worker.id} [PID: ${worker.process.pid}]`);

    return worker;
  }

  handleWorkerExit(worker, code, signal) {
    logger.warn(`⚠️ Worker ${worker.process.pid} exited. Code: ${code}, Signal: ${signal}`);

    this.workers.delete(worker.id);
    const attempts = this.restartAttempts.get(worker.id) || 0;

    if (attempts < this.MAX_RESTART_ATTEMPTS) {
      logger.info(`🔄 Restarting worker [Attempt ${attempts + 1}/${this.MAX_RESTART_ATTEMPTS}]`);

      setTimeout(() => {
        const newWorker = this.createWorker();
        this.restartAttempts.set(newWorker.id, attempts + 1);
      }, this.RESTART_DELAY);
    } else {
      logger.error(`❌ Worker ${worker.process.pid} failed to restart after ${this.MAX_RESTART_ATTEMPTS} attempts`);
      this.checkClusterHealth();
    }
  }

  handleWorkerMessage(worker, message) {
    if (message.type === 'error') {
      logger.error(`🚨 Error in Worker ${worker.process.pid}:`, message.error);
    } else if (message.type === 'status') {
      logger.info(`📡 Status from Worker ${worker.process.pid}:`, message.status);
    }
  }

  checkClusterHealth() {
    const activeWorkers = this.workers.size;
    if (activeWorkers < this.numCPUs / 2) {
      logger.error(`🔥 CRITICAL: More than 50% of workers are down!`);
      this.emergencyRestart();
    }
  }

  emergencyRestart() {
    logger.warn(`🚨 Initiating emergency cluster restart...`);

    for (const id of this.workers.keys()) {
      const worker = cluster.workers[id];
      if (worker) {
        worker.send('shutdown');
        setTimeout(() => {
          if (worker.exitedAfterDisconnect !== true) {
            worker.process.kill();
          }
        }, 5000);
      }
    }

    this.restartAttempts.clear();

    setTimeout(() => {
      this.initializeWorkers();
    }, this.RESTART_DELAY * 2);
  }

  setupExitHandlers() {
    process.on('SIGTERM', this.handleProcessTermination.bind(this));
    process.on('SIGINT', this.handleProcessTermination.bind(this));

    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception in Primary Process:', error);
      this.handleProcessTermination();
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('❌ Unhandled Promise Rejection in Primary Process:', reason);
    });
  }

  handleProcessTermination() {
    logger.info(`🛑 Received termination signal. Shutting down gracefully...`);

    for (const id of this.workers.keys()) {
      const worker = cluster.workers[id];
      if (worker) {
        worker.send('shutdown');
      }
    }

    setTimeout(() => {
      logger.warn('🔻 Forcing shutdown of remaining workers...');
      process.exit(0);
    }, 10000);
  }

  startWorker() {
    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception in Worker:', error);
      process.send({ type: 'error', error: error.message });
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('❌ Unhandled Rejection in Worker:', reason);
      process.send({ type: 'error', error: reason });
    });

    process.on('message', (msg) => {
      if (msg === 'shutdown') {
        logger.info(`📴 Worker ${process.pid} received shutdown signal`);
        this.gracefulShutdown();
      }
    });

    this.startServer();
  }

  gracefulShutdown() {
    logger.info(`🛑 Worker ${process.pid} shutting down...`);

    setTimeout(() => {
      process.exit(0);
    }, 5000);
  }

  async startServer() {
    try {
      logger.info(`
      🚀 Worker Server Started
      -------------------------------------------
      🏷️ Environment:    ${process.env.NODE_ENV || 'DEVELOPMENT'}
      🌍 Host:           ${process.env.HOST || '0.0.0.0'}
      🔌 Port:           ${process.env.PORT || 3001}
      🔧 Worker PID:     ${process.pid}
      🔄 CPU Cores:      ${this.numCPUs}
      📊 Engine Version: ${process.env.npm_package_version || '1.1.0'}
      -------------------------------------------
    `);
    } catch (error) {
      logger.error(`🚨 Failed to start worker server:`, error);
      process.exit(1);
    }
  }
}

const workerManager = new WorkerManager();
workerManager.start();
