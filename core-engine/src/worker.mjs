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

export class WorkerProcess {
  constructor() {
    this.isShuttingDown = false;
    this.setupErrorHandlers();
    this.setupProcessHandlers();
  }

  setupErrorHandlers() {
    process.on('uncaughtException', (error) => this.handleFatalError(error));
    process.on('unhandledRejection', (reason) => this.handleFatalError(reason));
  }

  setupProcessHandlers() {
    process.on('SIGTERM', () => this.handleGracefulShutdown());
    process.on('SIGINT', () => this.handleGracefulShutdown());

    process.on('message', (msg) => {
      if (msg === 'shutdown') this.handleGracefulShutdown();
    });
  }

  handleFatalError(error) {
    if (this.isShuttingDown) return;

    this.isShuttingDown = true;

    console.error(`Fatal error in worker ${process.pid}:`, error);


    if (process.send) {
      process.send({
        type: 'error',
        error: error.message || error,
        stack: error.stack,
        pid: process.pid,
      });
    }


    this.handleGracefulShutdown();
  }

  async handleGracefulShutdown() {
    if (this.isShuttingDown) return;

    this.isShuttingDown = true;

    console.log(`Worker ${process.pid} initiating graceful shutdown...`);

    try {
      await this.closeConnections();
      await this.waitForRequestsToComplete();
      console.log(`Worker ${process.pid} shutdown complete`);
      process.exit(0);
    } catch (error) {
      console.error(`Shutdown error in worker ${process.pid}:`, error);
      process.exit(1);
    }
  }

  async closeConnections() {
    // Close database, Redis, or other service connections
  }

  async waitForRequestsToComplete() {
    return new Promise((resolve) => setTimeout(resolve, 5000));
  }

  
  reportHealth() {
    if (process.send) {
      process.send({
        type: 'health',
        pid: process.pid,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
      });
    }
  }
}


export function initializeWorker() {
  if (cluster.isPrimary) return;
  const worker = new WorkerProcess();
  setInterval(() => worker.reportHealth(), 30000);
  return worker;
}

