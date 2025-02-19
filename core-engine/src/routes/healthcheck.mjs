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

import { logger } from '../config/logger.mjs';
import { metrics } from '../core/metrics.mjs';

function isValidResponse(data) {
  try {
    JSON.stringify(data);
    return true;
  } catch {
    return false;
  }
}

export function setupHealthRoute(app) {
  app.get('/api/healthcheck', async (req, res) => {
    const startTime = performance.now();
    try {
      const healthData = {
        status: '🟢 OK',
        uptime: `${process.uptime().toFixed(2)}s`,
        timestamp: new Date().toISOString(),
        nodeVersion: process.version || 'unknown',
        platform: process.platform || 'unknown',
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        metrics: metrics.getMetrics({ timeRange: 300000 }) // Last 5 minutes
      };

      if (!isValidResponse(healthData)) {
        throw new Error("Invalid JSON response");
      }

      const duration = performance.now() - startTime;
      metrics.record('healthcheck.duration', duration);
      metrics.gauge('healthcheck.status', 1);

      logger.info('Health check succeeded', {
        duration: `${duration.toFixed(2)}ms`
      });

      return res.status(200).json(healthData);
    } catch (error) {
      const duration = performance.now() - startTime;
      metrics.record('healthcheck.duration', duration);
      metrics.gauge('healthcheck.status', 0);

      logger.error(`❌ Health check failed: ${error.message}`, {
        error: error.stack,
        duration: `${duration.toFixed(2)}ms`
      });

      return res.status(500).json({
        error: 'Health check failed',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
}
