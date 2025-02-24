import { Router } from 'express';
import os from 'os';
import process from 'process';
import logger from '../utils/logger.mjs';

const router = Router();

/**
 * 📌 Simple API Endpoint
 * @route GET /simple
 * @returns {string} A basic response
 */
router.get('/', (req, res) => {
  res.send('👋 Welcome to the Simple API!');
});

/**
 * 🏥 Server Status Check
 * @route GET /simple/status
 * @returns {Object} Server status info
 */
router.get('/status', (req, res) => {
  try {
    const status = {
      status: '✅ Running',
      timestamp: new Date().toISOString(),
      uptime: `${process.uptime()} seconds`,
      platform: os.platform(),
      nodeVersion: process.version,
    };

    logger.info('📊 Simple API status checked');
    res.status(200).json(status);
  } catch (error) {
    logger.error(`❌ Status check failed: ${error.message}`);
    res.status(500).json({ error: 'Status check failed' });
  }
});

/**
 * 🔄 Refresh Endpoint (Mock)
 * @route POST /simple/refresh
 */
router.post('/refresh', (req, res) => {
  logger.info('🔄 Simple API refreshed');
  res.status(200).json({ message: 'Simple API refreshed successfully' });
});

/**
 * ❌ 404 Handler for Unhandled Routes
 */
router.use((req, res) => {
  logger.warn(`⚠️ 404 Not Found: ${req.originalUrl}`);
  res.status(404).json({ error: 'Simple API route not found' });
});

export default router;
