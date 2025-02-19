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
'use strict';

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import winston from 'winston';

const router = Router();

// ✅ Winston Logger for structured logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/data.log' })
  ]
});

// ✅ Middleware for input validation
const validateRequest = (validations) => [
  ...validations,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn(`⚠️ Validation failed: ${JSON.stringify(errors.array())}`);
      return res.status(400).json({ status: 'error', message: 'Invalid input', errors: errors.array() });
    }
    next();
  }
];

/**
 * ✅ Route: POST /
 * 🔹 Receive and store data
 */
router.post(
  '/',
  validateRequest([body('data').notEmpty().withMessage('Data field is required')]),
  async (req, res) => {
    try {
      const startTime = process.hrtime();
      logger.info(`📩 Data received: ${JSON.stringify(req.body)}`);

      res.status(201).json({
        status: 'success',
        message: 'Data received successfully',
        data: req.body.data
      });

      const endTime = process.hrtime(startTime);
      logger.info(`✅ Data processed in ${endTime[1] / 1e6} ms`);
    } catch (error) {
      logger.error(`❌ Error in POST /: ${error.message}`);
      res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
  }
);

/**
 * ✅ Route: PUT /
 * 🔹 Update existing data
 */
router.put(
  '/',
  validateRequest([body('data').notEmpty().withMessage('Data field is required')]),
  async (req, res) => {
    try {
      logger.info(`🔄 Data updated: ${JSON.stringify(req.body)}`);

      res.status(200).json({
        status: 'success',
        message: 'Data updated successfully'
      });
    } catch (error) {
      logger.error(`❌ Error in PUT /: ${error.message}`);
      res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
  }
);

/**
 * ✅ Route: DELETE /
 * 🔹 Delete data
 */
router.delete('/', async (req, res) => {
  try {
    logger.warn('🗑️ Data deletion requested');

    res.status(200).json({
      status: 'success',
      message: 'Data deleted successfully'
    });
  } catch (error) {
    logger.error(`❌ Error in DELETE /: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * ✅ Route: PATCH /
 * 🔹 Partially update data
 */
router.patch(
  '/',
  validateRequest([body('update').notEmpty().withMessage('Update field is required')]),
  async (req, res) => {
    try {
      logger.info(`🔧 Data patched: ${JSON.stringify(req.body)}`);

      res.status(200).json({
        status: 'success',
        message: 'Data patched successfully'
      });
    } catch (error) {
      logger.error(`❌ Error in PATCH /: ${error.message}`);
      res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
  }
);

/**
 * ✅ Route: HEAD /
 * 🔹 Check service availability
 */
router.head('/', (req, res) => {
  logger.info('🔍 HEAD request received');
  res.status(200).send();
});

/**
 * ✅ Route: OPTIONS /
 * 🔹 CORS preflight handling
 */
router.options('/', (req, res) => {
  logger.info('🌍 OPTIONS request received');
  res.status(204).set({
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
  }).send();
});

// ✅ Middleware: Handle 404 for undefined routes
router.use((req, res) => {
  logger.warn(`⚠️ 404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

// ✅ Middleware: Global error handler
router.use((err, req, res, next) => {
  logger.error(`🔥 Unhandled error: ${err.message}`);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});

export default router;
