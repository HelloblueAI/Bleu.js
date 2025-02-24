import { Router } from 'express';
import os from 'os';
import process from 'process';
import logger from '../utils/logger.mjs';

const router = Router();

/**
 * 📊 Get System Metrics
 * @route GET /metrics/system
 * @returns {Object} System performance metrics
 */
router.get('/system', (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(), // Server uptime in seconds
      memoryUsage: process.memoryUsage(), // Memory consumption
      cpuUsage: process.cpuUsage(), // CPU utilization
      loadAverage: os.loadavg(), // 1, 5, and 15 minute load average
      freeMemory: os.freemem(), // Available memory
      totalMemory: os.totalmem(), // Total system memory
      platform: os.platform(), // OS platform (linux, darwin, win32)
      nodeVersion: process.version, // Current Node.js version
    };

    logger.info('📊 System metrics retrieved successfully');
    res.status(200).json(metrics);
  } catch (error) {
    logger.error(`❌ Error retrieving system metrics: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * 🚀 Get API Performance Metrics
 * @route GET /metrics/performance
 * @returns {Object} API request performance data
 */
router.get('/performance', (req, res) => {
  try {
    const performanceMetrics = {
      requestCount: global.requestCount || 0, // Track API requests
      averageResponseTime: global.averageResponseTime || 0, // Avg response time
      activeConnections: global.activeConnections || 0, // Active WebSocket/API connections
    };

    logger.info('📈 API performance metrics retrieved');
    res.status(200).json(performanceMetrics);
  } catch (error) {
    logger.error(`❌ Error retrieving performance metrics: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * 📌 404 Handler for Unhandled Metrics Routes
 */
router.use((req, res) => {
  logger.warn(`⚠️ 404 Not Found: ${req.originalUrl}`);
  res.status(404).json({ error: 'Metrics route not found' });
});

export default router;
