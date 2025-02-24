/* eslint-env node */
import { Router } from 'express';
import apiRoutes from './apiRoutes.mjs';
import healthRoutes from './healthRoutes.mjs';
import dataRoutes from './dataRoutes.mjs';
import logger from '../utils/logger.mjs';

const router = Router();

/**
 * Main API Routes
 */
router.use('/api', apiRoutes);

/**
 * Health Check Routes
 */
router.use('/health', healthRoutes);

/**
 * Data Processing Routes
 */
router.use('/data', dataRoutes);

/**
 * 404 - Catch All Unhandled Routes
 */
router.use((req, res) => {
  logger.warn(`⚠️ 404 Not Found: ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
});

/**
 * Global Error Handler
 */
router.use((err, req, res, next) => {
  logger.error(`❌ Error in ${req.method} ${req.originalUrl}: ${err.message}`);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default router;
