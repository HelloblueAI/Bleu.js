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
import winston from 'winston';
import { body, param, validationResult } from 'express-validator';
import {
  getRules,
  addRule,
  updateRule,
  deleteRule,
  monitorDependencies,
  trainModel,
} from '../controllers/rulesController.mjs';

const router = Router();

// ✅ Winston Logger for structured logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/api.log' }),
  ],
});

// ✅ Middleware for input validation
const validateRequest = (validations) => [
  ...validations,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn(`⚠️ Validation failed: ${JSON.stringify(errors.array())}`);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid input',
        errors: errors.array(),
      });
    }
    next();
  },
];

/**
 * ✅ Route: GET /rules
 * 🔹 Fetch all rules
 */
router.get('/rules', async (req, res, next) => {
  try {
    const startTime = process.hrtime();
    await getRules(req, res);
    const endTime = process.hrtime(startTime);
    logger.info(`📊 Fetched rules in ${endTime[1] / 1e6} ms`);
  } catch (error) {
    logger.error(`❌ Error in GET /rules: ${error.message}`);
    next(error);
  }
});

/**
 * ✅ Route: POST /rules
 * 🔹 Add a new rule
 */
router.post(
  '/rules',
  validateRequest([
    body('name').isString().notEmpty().withMessage('Rule name is required'),
    body('conditions').isArray().withMessage('Conditions should be an array'),
  ]),
  async (req, res, next) => {
    try {
      await addRule(req, res);
      logger.info(`✅ Rule added: ${JSON.stringify(req.body)}`);
    } catch (error) {
      logger.error(`❌ Error in POST /rules: ${error.message}`);
      next(error);
    }
  },
);

/**
 * ✅ Route: PUT /rules/:id
 * 🔹 Update a specific rule by ID
 */
router.put(
  '/rules/:id',
  validateRequest([
    param('id').isMongoId().withMessage('Invalid rule ID'),
    body('updates').isObject().notEmpty().withMessage('Updates are required'),
  ]),
  async (req, res, next) => {
    try {
      await updateRule(req, res);
      logger.info(`🔄 Rule updated: ${req.params.id}`);
    } catch (error) {
      logger.error(`❌ Error in PUT /rules/:id: ${error.message}`);
      next(error);
    }
  },
);

/**
 * ✅ Route: DELETE /rules/:id
 * 🔹 Delete a specific rule by ID
 */
router.delete(
  '/rules/:id',
  validateRequest([param('id').isMongoId().withMessage('Invalid rule ID')]),
  async (req, res, next) => {
    try {
      await deleteRule(req, res);
      logger.info(`🗑️ Rule deleted: ${req.params.id}`);
    } catch (error) {
      logger.error(`❌ Error in DELETE /rules/:id: ${error.message}`);
      next(error);
    }
  },
);

/**
 * ✅ Route: GET /dependencies
 * 🔹 Monitor system dependencies
 */
router.get('/dependencies', async (req, res, next) => {
  try {
    await monitorDependencies(req, res);
    logger.info(`🛠️ System dependencies checked`);
  } catch (error) {
    logger.error(`❌ Error in GET /dependencies: ${error.message}`);
    next(error);
  }
});

/**
 * ✅ Route: POST /trainModel
 * 🔹 Train a machine learning model
 */
router.post(
  '/trainModel',
  validateRequest([
    body('trainingData')
      .isArray()
      .withMessage('Training data must be an array'),
  ]),
  async (req, res, next) => {
    try {
      await trainModel(req, res);
      logger.info(`🧠 Model training started`);
    } catch (error) {
      logger.error(`❌ Error in POST /trainModel: ${error.message}`);
      next(error);
    }
  },
);

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
