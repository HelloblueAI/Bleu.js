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


    for (let i = 0; i < this.numCPUs; i++) {
      this.createWorker();
    }


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


    for (const worker of Object.values(cluster.workers)) {
      worker.send('shutdown');
    }


    const shutdownTimeout = setTimeout(() => {
      console.log('Forcing shutdown of remaining workers...');
      for (const worker of Object.values(cluster.workers)) {
        worker.kill('SIGKILL');
      }
    }, 10000);


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
