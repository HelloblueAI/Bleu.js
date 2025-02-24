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

import { Router } from 'express';
import logger from '../utils/logger.mjs';
import {
  getRules,
  addRule,
  updateRule,
  deleteRule,
  monitorDependencies,
  trainModel,
} from '../controllers/rulesController.mjs';

const router = Router();

/**
 * Wrapper function for handling async errors.
 * @param {Function} fn - The async route handler function.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Route: GET /rules - Fetch all rules.
 */
router.get('/rules', asyncHandler(getRules));

/**
 * Route: POST /rules - Add a new rule.
 */
router.post('/rules', asyncHandler(addRule));

/**
 * Route: PUT /rules/:id - Update a specific rule by ID.
 */
router.put('/rules/:id', asyncHandler(updateRule));

/**
 * Route: DELETE /rules/:id - Delete a specific rule by ID.
 */
router.delete('/rules/:id', asyncHandler(deleteRule));

/**
 * Route: GET /dependencies - Monitor system dependencies.
 */
router.get('/dependencies', asyncHandler(monitorDependencies));

/**
 * Route: POST /trainModel - Train a machine learning model.
 */
router.post('/trainModel', asyncHandler(trainModel));

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
