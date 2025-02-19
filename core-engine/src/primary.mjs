import cluster from 'cluster';
import os from 'os';

export class PrimaryManager {
  constructor() {
    this.numCPUs = os.cpus().length;
    this.workers = new Map();
    this.healthData = new Map();
    this.setupPrimaryProcess();
  }

  setupPrimaryProcess() {
    cluster.on('exit', (worker, code, signal) => {
      this.handleWorkerExit(worker, code, signal);
    });

    cluster.on('message', (worker, message) => {
      this.handleWorkerMessage(worker, message);
    });

    process.on('SIGTERM', () => this.handleGracefulShutdown());
    process.on('SIGINT', () => this.handleGracefulShutdown());
  }

  start() {
    console.log(`Primary process ${process.pid} is running`);

    // Fork workers
    for (let i = 0; i < this.numCPUs; i++) {
      this.createWorker();
    }

    // Start health check interval
    setInterval(() => this.checkWorkersHealth(), 60000);
  }

  createWorker() {
    const worker = cluster.fork();
    this.workers.set(worker.id, {
      pid: worker.process.pid,
      startTime: Date.now(),
      restarts: 0,
    });
    return worker;
  }

  handleWorkerExit(worker, code, signal) {
    const workerInfo = this.workers.get(worker.id);
    console.log(
      `Worker ${worker.process.pid} died. Code: ${code}, Signal: ${signal}`,
    );

    if (workerInfo && workerInfo.restarts < 5) {
      console.log(`Restarting worker ${worker.process.pid}...`);
      const newWorker = this.createWorker();
      this.workers.set(newWorker.id, {
        ...workerInfo,
        restarts: workerInfo.restarts + 1,
        pid: newWorker.process.pid,
        startTime: Date.now(),
      });
    } else {
      console.error(
        `Worker ${worker.process.pid} has crashed too many times. Not restarting.`,
      );
    }

    this.workers.delete(worker.id);
    this.healthData.delete(worker.id);
  }

  handleWorkerMessage(worker, message) {
    if (message.type === 'health') {
      this.healthData.set(worker.id, {
        ...message,
        lastUpdate: Date.now(),
      });
    } else if (message.type === 'error') {
      console.error(`Error from worker ${worker.process.pid}:`, message.error);
    }
  }

  checkWorkersHealth() {
    const now = Date.now();
    for (const [workerId, health] of this.healthData) {
      if (now - health.lastUpdate > 60000) {
        console.warn(`Worker ${health.pid} hasn't reported health in >60s`);
        const worker = cluster.workers[workerId];
        if (worker) {
          console.log(`Killing unresponsive worker ${health.pid}`);
          worker.kill();
        }
      }
    }
  }

  async handleGracefulShutdown() {
    console.log('Primary process initiating graceful shutdown...');

    // Notify all workers to shut down
    for (const worker of Object.values(cluster.workers)) {
      worker.send('shutdown');
    }

    // Wait for workers to exit (max 10 seconds)
    const shutdownTimeout = setTimeout(() => {
      console.log('Forcing shutdown of remaining workers...');
      for (const worker of Object.values(cluster.workers)) {
        worker.kill('SIGKILL');
      }
    }, 10000);

    // Wait for all workers to exit
    await Promise.all(
      Object.values(cluster.workers).map(
        (worker) => new Promise((resolve) => worker.on('exit', resolve)),
      ),
    );

    clearTimeout(shutdownTimeout);
    console.log('All workers have exited. Shutting down primary process.');
    process.exit(0);
  }
}
