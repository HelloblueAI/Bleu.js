'use strict';

import { Router } from 'express';
import winston from 'winston';

const router = Router();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/simpleRoute.log' })
  ]
});
router.get('/simple', (req, res) => {
  logger.info(`📡 Simple route accessed from ${req.ip}`);
  res.status(200).json({
    status: 'success',
    message: 'Hello from the simple server!',
    timestamp: new Date().toISOString(),
    server: process.env.SERVER_NAME || 'Bleu.js API Server',
  });
});


router.use((req, res) => {
  logger.warn(`⚠️ 404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ status: 'error', message: 'Simple route not found' });
});

export default router;
