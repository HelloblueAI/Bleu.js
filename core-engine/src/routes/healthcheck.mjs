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


const MEMORY_THRESHOLD = 0.9; // 90% memory usage warning
const CPU_THRESHOLD = 0.8; // 80% CPU usage warning
const METRICS_WINDOW = 300000; // 5 minutes

function isValidResponse(data) {
 try {
   JSON.stringify(data);
   return true;
 } catch {
   return false;
 }
}

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
     memoryUsagePercent: ((totalMem - freeMem) / totalMem * 100).toFixed(2) + '%',
     warning: (totalMem - freeMem) / totalMem > MEMORY_THRESHOLD
   },
   cpu: {
     user: cpu.user,
     system: cpu.system,
     loadAverage: {
       '1m': loadAvg[0],
       '5m': loadAvg[1],
       '15m': loadAvg[2]
     },
     warning: loadAvg[0] > CPU_THRESHOLD * os.cpus().length
   },
   process: {
     uptime: process.uptime(),
     pid: process.pid,
     nodeVersion: process.version,
     platform: process.platform,
     arch: process.arch
   }
 };
}

function checkServices() {
 return {
   database: metrics.getMetrics().databaseConnected ? '🟢' : '🔴',
   cache: metrics.getMetrics().cacheConnected ? '🟢' : '🔴',
   queue: metrics.getMetrics().queueConnected ? '🟢' : '🔴'
 };
}

function getServiceStatus(systemMetrics, serviceChecks) {
 if (Object.values(serviceChecks).some(status => status === '🔴')) {
   return '🔴 Critical - Service Unavailable';
 }
 if (systemMetrics.memory.warning || systemMetrics.cpu.warning) {
   return '🟡 Warning - System Under Load';
 }
 return '🟢 Healthy';
}

export function setupHealthRoute(app) {
 // Basic health endpoint
 app.get('/health', (req, res) => {
   res.status(200).json({ status: 'OK' });
 });

 // Detailed health check endpoint
 app.get('/api/healthcheck', async (req, res) => {
   const startTime = performance.now();

   try {
     // Collect system metrics
     const systemMetrics = getSystemMetrics();
     const serviceChecks = checkServices();

     const healthData = {
       status: getServiceStatus(systemMetrics, serviceChecks),
       services: serviceChecks,
       system: systemMetrics,
       performance: {
         requestsPerMinute: metrics.getMetrics().requestsPerMinute,
         averageResponseTime: metrics.getMetrics().averageResponseTime,
         errorRate: metrics.getMetrics().errorRate
       },
       metrics: metrics.getMetrics({
         timeRange: METRICS_WINDOW,
         detailed: req.query.detailed === 'true'
       }),
       timestamp: new Date().toISOString()
     };

     if (!isValidResponse(healthData)) {
       throw new Error('Invalid health check response format');
     }

     const duration = performance.now() - startTime;

     // Record metrics
     metrics.trackRequest(startTime, true, {
       endpoint: '/api/healthcheck',
       duration
     });

     logger.info('✅ Health check succeeded', {
       status: healthData.status,
       duration: `${duration.toFixed(2)}ms`,
       warnings: {
         memory: systemMetrics.memory.warning,
         cpu: systemMetrics.cpu.warning
       }
     });

     return res.status(200).json(healthData);

   } catch (error) {
     const duration = performance.now() - startTime;

     metrics.trackRequest(startTime, false, {
       endpoint: '/api/healthcheck',
       error: error.message
     });

     logger.error('❌ Health check failed', {
       error: error.message,
       stack: error.stack,
       duration: `${duration.toFixed(2)}ms`
     });

     return res.status(503).json({
       status: '🔴 Service Unavailable',
       error: error.message,
       timestamp: new Date().toISOString(),
       retryAfter: 30 // seconds
     });
   }
 });

 // Detailed metrics endpoint
 app.get('/api/metrics', (req, res) => {
   res.header('Content-Type', 'text/plain');
   res.send(metrics.getPrometheusMetrics());
 });
}
