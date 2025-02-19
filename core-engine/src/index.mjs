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

import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { performance } from 'perf_hooks';
import { logger } from './config/logger.mjs';
import { metrics } from './core/metrics.mjs';
import { AdvancedCircuitBreaker } from './core/circuit-breaker.mjs';
import { setupRoutes } from './routes/index.mjs';
import { setupMiddleware } from './middleware/index.mjs';
import { setupWebSocketServer } from './core/websocket.mjs';
import {
  DEFAULT_PORT,
  DEFAULT_HOST,
  CPU_CORES,
  SHUTDOWN_TIMEOUT
} from './config/constants.mjs';

class BleuServer {
  constructor() {
    this.app = null;
    this.server = null;
    this.wss = null;
    this.circuitBreaker = null;
    this.startTime = performance.now();
  }

  async initialize() {
    try {
      dotenv.config();

      if (cluster.isPrimary) {
        await this.startPrimaryProcess();
      } else {
        await this.startWorkerProcess();
      }
    } catch (error) {
      logger.error('Server initialization failed:', error);
      process.exit(1);
    }

  }
  async startPrimaryProcess() {
    logger.info(`Primary process v1.0.36 ${process.pid} is running`);
    metrics.gauge('cluster.master_pid', process.pid);

    this.setupClusterEvents();
    this.forkWorkers();
    this.setupProcessEvents();
  }

  async startWorkerProcess() {
    this.app = express();
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    this.circuitBreaker = new AdvancedCircuitBreaker();

    await this.setupWorkerComponents();
    await this.startServer();

  }

  setupClusterEvents() {
    cluster.on('exit', this.handleWorkerExit.bind(this));
    cluster.on('message', this.handleWorkerMessage.bind(this));
  }

  forkWorkers() {
    for (let i = 0; i < CPU_CORES; i++) {
      const worker = cluster.fork();
      metrics.gauge(`cluster.worker_${worker.id}_pid`, worker.process.pid);
    }
  }

  async setupWorkerComponents() {
    setupMiddleware(this.app);
    setupRoutes(this.app, this.circuitBreaker);
    setupWebSocketServer(this.wss);
    this.setupHealthCheck();
  }

  async startServer() {
    const port = process.env.PORT || DEFAULT_PORT;
    const host = process.env.HOST || DEFAULT_HOST;

    return new Promise((resolve) => {
      this.server.listen(port, host, () => {
        this.logServerStart(port, host);
        resolve();
      });
    });
  }

  setupHealthCheck() {
    const startTime = this.startTime;
    setInterval(() => {
      const uptime = performance.now() - startTime;
      metrics.gauge('server.uptime', uptime);
      metrics.gauge('server.memory_usage', process.memoryUsage().heapUsed);
      metrics.gauge('server.cpu_usage', process.cpuUsage().user);
    }, 30000);
  }

  handleWorkerExit(worker, code, signal) {
    logger.warn(`Worker ${worker.process.pid} died`, {
      code,
      signal,
      timestamp: new Date().toISOString()
    });

    metrics.counter('cluster.worker_deaths');
    const newWorker = cluster.fork();
    metrics.gauge(`cluster.worker_${newWorker.id}_pid`, newWorker.process.pid);
  }

  handleWorkerMessage(worker, message) {
    if (message.type === 'metrics') {
      metrics.record(message.name, message.value, {
        ...message.tags,
        worker_id: worker.id
      });
    }
  }

  setupProcessEvents() {
    ['SIGTERM', 'SIGINT'].forEach(signal => {
      process.on(signal, () => this.handleGracefulShutdown(signal));
    });

    process.on('uncaughtException', this.handleUncaughtException.bind(this));
    process.on('unhandledRejection', this.handleUnhandledRejection.bind(this));
  }

  async handleGracefulShutdown(signal) {
    logger.warn(`Received ${signal}. Initiating graceful shutdown...`);
    metrics.counter('server.shutdown_initiated');

    try {
      if (cluster.isPrimary) {
        await this.shutdownPrimaryProcess(signal);
      } else {
        await this.shutdownWorkerProcess(signal);
      }
    } catch (error) {
      logger.error('Shutdown error:', error);
      process.exit(1);
    }
  }

  async shutdownPrimaryProcess(signal) {
    for (const worker of Object.values(cluster.workers)) {
      worker.send({ type: 'shutdown', signal });
    }

    setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT).unref();
  }

  async shutdownWorkerProcess(signal) {
    try {
      if (this.wss) {
        await new Promise(resolve => this.wss.close(resolve));
      }
      if (this.server) {
        await new Promise(resolve => this.server.close(resolve));
      }
      logger.info('✅ Server closed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  logServerStart(port, host) {
    logger.info(`
      🚀 Worker server started
      -------------------------------------------
      🏷️ Environment:    ${process.env.NODE_ENV?.toUpperCase() || 'DEVELOPMENT'}
      🌍 Host:           ${host}
      🔌 Port:           ${port}
      🔧 Worker PID:     ${process.pid}
      🔄 CPU Cores:      ${CPU_CORES}
      📊 Engine Version: ${process.env.ENGINE_VERSION || '1.1.0'}
      -------------------------------------------
    `);
    

    metrics.gauge('server.port', port);
    metrics.gauge('server.cpu_cores', CPU_CORES);
  }
}

const server = new BleuServer();
await server.initialize();

export const app = server.app;
export const httpServer = server.server;
export const wss = server.wss;
export { metrics, logger };
