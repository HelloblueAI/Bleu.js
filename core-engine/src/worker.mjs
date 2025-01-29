// src/worker.mjs
import cluster from 'cluster';

export class WorkerProcess {
  constructor() {
    this.isShuttingDown = false;
    this.setupErrorHandlers();
    this.setupProcessHandlers();
  }

  setupErrorHandlers() {
    // Domain error handler
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.handleFatalError(error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection:', reason);
      this.handleFatalError(reason);
    });
  }

  setupProcessHandlers() {
    process.on('SIGTERM', () => this.handleGracefulShutdown());
    process.on('SIGINT', () => this.handleGracefulShutdown());

    // Handle messages from master
    process.on('message', (msg) => {
      if (msg === 'shutdown') {
        this.handleGracefulShutdown();
      }
    });
  }

  handleFatalError(error) {
    if (this.isShuttingDown) return;

    this.isShuttingDown = true;
    console.error(`Fatal error in worker ${process.pid}:`, error);

    // Notify master about the error
    if (process.send) {
      process.send({
        type: 'error',
        error: error.message || error,
        stack: error.stack,
        pid: process.pid
      });
    }

    // Begin graceful shutdown
    this.handleGracefulShutdown();
  }

  async handleGracefulShutdown() {
    if (this.isShuttingDown) return;

    this.isShuttingDown = true;
    console.log(`Worker ${process.pid} starting graceful shutdown...`);

    try {
      // Close all active connections
      this.closeConnections();

      // Wait for ongoing requests to complete (max 5 seconds)
      await this.waitForRequestsToComplete();

      console.log(`Worker ${process.pid} completed graceful shutdown`);
      process.exit(0);
    } catch (error) {
      console.error(`Error during shutdown of worker ${process.pid}:`, error);
      process.exit(1);
    }
  }

  closeConnections() {
    // Implement connection closing logic here
    // For example, close database connections, Redis clients, etc.
  }

  async waitForRequestsToComplete() {
    return new Promise((resolve) => {
      // Add logic to wait for ongoing requests
      // For now, we'll just wait 5 seconds
      setTimeout(resolve, 5000);
    });
  }

  // Method to report health status to master
  reportHealth() {
    if (process.send) {
      process.send({
        type: 'health',
        pid: process.pid,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      });
    }
  }
}

// Export a function to initialize the worker
export function initializeWorker() {
  if (cluster.isPrimary) {
    console.warn('Worker initialization called in primary process');
    return;
  }

  const worker = new WorkerProcess();

  // Start health reporting
  setInterval(() => {
    worker.reportHealth();
  }, 30000); // Report every 30 seconds

  return worker;
}
