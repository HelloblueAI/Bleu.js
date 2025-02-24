import { Router } from 'express';
import logger from '../utils/logger.mjs';
import { connect, disconnect } from '../database/db.mjs';

const router = Router();

/**
 * Health Check - Basic server status
 * Route: GET /health
 */
router.get('/health', (req, res) => {
  logger.info('🩺 Health check endpoint hit');
  res.status(200).json({
    status: '✅ OK',
    message: 'Server is running smoothly',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Database Health Check
 * Route: GET /health/db
 */
router.get('/health/db', async (req, res) => {
  try {
    await connect();
    logger.info('🗄️ Database connection is active');
    res.status(200).json({
      status: '✅ OK',
      message: 'Database is connected',
    });
    await disconnect(); // Ensure the connection is closed after the check
  } catch (error) {
    logger.error('❌ Database connection error:', error.message);
    res.status(500).json({
      status: '❌ ERROR',
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

/**
 * Middleware: Handle 404 for undefined routes.
 */
router.use((req, res) => {
  logger.warn(`⚠️ Route not found: ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
});

/**
 * Global error handler.
 */
router.use((err, req, res, next) => {
  logger.error(
    `❌ Unhandled error in ${req.method} ${req.originalUrl}: ${err.message}`,
  );
  res.status(500).json({ error: 'Internal Server Error' });
});

export default router;
