'use strict';

import { Router } from 'express';
import apiRoutes from './apiRoutes.js';
import dataRoutes from './dataRoutes.js';
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
    new winston.transports.File({ filename: 'logs/routes.log' })
  ]
});


router.use('/api', apiRoutes);
router.use('/data', dataRoutes);

logger.info('✅ Routes initialized successfully');

export default router;
