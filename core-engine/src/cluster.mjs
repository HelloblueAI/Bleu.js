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
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
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
      logger.info(`Primary process ${process.pid} is running`);
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
  }

  createWorker() {
    const worker = cluster.fork();
    this.workers.set(worker.id, {
      pid: worker.process.pid,
      startTime: Date.now(),
    });

    worker.on('message', (msg) => {
      this.handleWorkerMessage(worker, msg);
    });

    return worker;
  }

  handleWorkerExit(worker, code, signal) {
    logger.warn(
      `Worker ${worker.process.pid} died. Code: ${code}, Signal: ${signal}`,
    );

    this.workers.delete(worker.id);
    const attempts = this.restartAttempts.get(worker.id) || 0;

    if (attempts < this.MAX_RESTART_ATTEMPTS) {
      logger.info(
        `Attempting to restart worker. Attempt ${attempts + 1}/${this.MAX_RESTART_ATTEMPTS}`,
      );

      setTimeout(() => {
        const newWorker = this.createWorker();
        this.restartAttempts.set(newWorker.id, attempts + 1);
      }, this.RESTART_DELAY);
    } else {
      logger.error(
        `Worker ${worker.process.pid} failed to restart after ${this.MAX_RESTART_ATTEMPTS} attempts`,
      );
      this.checkClusterHealth();
    }
  }

  handleWorkerMessage(worker, msg) {
    if (msg.type === 'error') {
      logger.error(`Error in worker ${worker.process.pid}:`, msg.error);
    } else if (msg.type === 'status') {
      logger.info(`Status from worker ${worker.process.pid}:`, msg.status);
    }
  }

  checkClusterHealth() {
    const activeWorkers = this.workers.size;
    if (activeWorkers < this.numCPUs / 2) {
      logger.error(
        'Critical: More than 50% of workers are down. Initiating emergency restart.',
      );
      this.emergencyRestart();
    }
  }

  emergencyRestart() {
    logger.warn('Initiating emergency cluster restart');

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
      logger.error('Uncaught Exception in primary process:', error);
      this.handleProcessTermination();
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection in primary process:', reason);
    });
  }

  handleProcessTermination() {
    logger.info('Received termination signal. Initiating graceful shutdown...');

    for (const id of this.workers.keys()) {
      const worker = cluster.workers[id];
      if (worker) {
        worker.send('shutdown');
      }
    }

    setTimeout(() => {
      logger.info('Forcing shutdown of remaining workers...');
      process.exit(0);
    }, 10000);
  }

  startWorker() {
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception in worker:', error);
      process.send({ type: 'error', error: error.message });
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection in worker:', reason);
      process.send({ type: 'error', error: reason });
    });

    process.on('message', (msg) => {
      if (msg === 'shutdown') {
        logger.info(`Worker ${process.pid} received shutdown signal`);
        this.gracefulShutdown();
      }
    });

    this.startServer();
  }

  gracefulShutdown() {
    logger.info(`Worker ${process.pid} is shutting down...`);

    setTimeout(() => {
      process.exit(0);
    }, 5000);
  }

  async startServer() {
    try {
      logger.info(`
      🚀 Worker server started
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
      logger.error('Failed to start worker server:', error);
      process.exit(1);
    }
  }
}

const workerManager = new WorkerManager();
workerManager.start();
