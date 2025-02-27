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

import { performance } from 'perf_hooks';
import os from 'os';
import { logger } from '../config/logger.mjs';
import metrics from '../core/metrics.mjs';

const MEMORY_THRESHOLD = parseFloat(process.env.MEMORY_THRESHOLD) || 0.9; // Default 90%
const CPU_THRESHOLD = parseFloat(process.env.CPU_THRESHOLD) || 0.8; // Default 80%
const METRICS_WINDOW = parseInt(process.env.METRICS_WINDOW, 10) || 300000; // Default 5 minutes

/**
 * Checks if the response data is valid JSON.
 * @param {object} data
 * @returns {boolean}
 */
function isValidResponse(data) {
  try {
    JSON.stringify(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Collects system metrics.
 * @returns {object} System metrics data.
 */
function getSystemMetrics() {
  const memory = process.memoryUsage();
  const cpu = process.cpuUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const loadAvg = os.loadavg();

  return {
    memory: {
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal,
      rss: memory.rss,
      memoryUsagePercent: `${(((totalMem - freeMem) / totalMem) * 100).toFixed(2)}%`,
      warning: (totalMem - freeMem) / totalMem > MEMORY_THRESHOLD,
    },
    cpu: {
      user: cpu.user,
      system: cpu.system,
      loadAverage: {
        '1m': loadAvg[0],
        '5m': loadAvg[1],
        '15m': loadAvg[2],
      },
      warning: loadAvg[0] > CPU_THRESHOLD * os.cpus().length,
    },
    process: {
      uptime: process.uptime(),
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      env: process.env.NODE_ENV || 'development',
    },
  };
}

/**
 * Checks the status of services like database, cache, and queues.
 * @returns {object} Service availability.
 */
function checkServices() {
  const serviceStatus = {
    database: metrics.getMetrics().databaseConnected ? '🟢' : '🔴',
    cache: metrics.getMetrics().cacheConnected ? '🟢' : '🔴',
    queue: metrics.getMetrics().queueConnected ? '🟢' : '🔴',
  };

  return serviceStatus;
}

/**
 * Determines overall service status.
 * @param {object} systemMetrics - System metrics.
 * @param {object} serviceChecks - Service availability.
 * @returns {string} Status indicator.
 */
function getServiceStatus(systemMetrics, serviceChecks) {
  if (Object.values(serviceChecks).some((status) => status === '🔴')) {
    return '🔴 CRITICAL - Service Unavailable';
  }
  if (systemMetrics.memory.warning || systemMetrics.cpu.warning) {
    return '🟡 WARNING - System Under Load';
  }
  return '🟢 HEALTHY';
}

/**
 * Sets up health check routes for the Express app.
 * @param {object} app - Express app instance.
 */
export function setupHealthRoute(app) {
  // ✅ Add support for `/api/health`
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: '✅ Server is running' });
  });

  // ✅ Basic health check (legacy route)
  app.get('/health', (req, res) => {
    res.status(200).json({ status: '✅ OK' });
  });

  // ✅ Detailed health check
  app.get('/api/healthcheck', async (req, res) => {
    const startTime = performance.now();
    try {
      const systemMetrics = getSystemMetrics();
      const serviceChecks = checkServices();

      const healthData = {
        status: getServiceStatus(systemMetrics, serviceChecks),
        services: serviceChecks,
        system: systemMetrics,
        performance: {
          requestsPerMinute: metrics.getMetrics().requestsPerMinute,
          averageResponseTime: metrics.getMetrics().averageResponseTime,
          errorRate: metrics.getMetrics().errorRate,
        },
        metrics: metrics.getMetrics({
          timeRange: METRICS_WINDOW,
          detailed: req.query.detailed === 'true',
        }),
        timestamp: new Date().toISOString(),
      };

      if (!isValidResponse(healthData)) {
        throw new Error('Invalid health check response format');
      }

      const duration = performance.now() - startTime;
      metrics.trackRequest(startTime, true, {
        endpoint: '/api/healthcheck',
        duration,
      });

      logger.info('✅ Health check succeeded', {
        status: healthData.status,
        duration: `${duration.toFixed(2)}ms`,
      });

      return res.status(200).json(healthData);
    } catch (error) {
      const duration = performance.now() - startTime;
      metrics.trackRequest(startTime, false, {
        endpoint: '/api/healthcheck',
        error: error.message,
      });

      logger.error('❌ Health check failed', {
        error: error.message,
        stack: error.stack,
        duration: `${duration.toFixed(2)}ms`,
      });

      return res.status(503).json({
        status: '🔴 SERVICE UNAVAILABLE',
        error: error.message,
        timestamp: new Date().toISOString(),
        retryAfter: 30, // Retry in 30 seconds
      });
    }
  });

  // ✅ Prometheus metrics endpoint
  app.get('/api/metrics', (req, res) => {
    res.header('Content-Type', 'text/plain');
    res.send(metrics.getPrometheusMetrics());
  });
}
