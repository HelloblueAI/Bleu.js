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

const router = Router();

/**
 * Wrapper function for handling async errors.
 * @param {Function} fn - The async route handler function.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Route: POST / - Create data
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    logger.info('📥 Data received:', req.body);
    res.status(201).json({ message: '✅ Data received', data: req.body.data });
  }),
);

/**
 * Route: PUT / - Update data
 */
router.put(
  '/',
  asyncHandler(async (req, res) => {
    logger.info('🔄 Data updated:', req.body);
    res.status(200).json({ message: '✅ Data updated', data: req.body });
  }),
);

/**
 * Route: DELETE / - Delete data
 */
router.delete(
  '/',
  asyncHandler(async (req, res) => {
    logger.warn('🗑️ Data deletion request received');
    res.status(200).json({ message: '✅ Data deleted' });
  }),
);

/**
 * Route: PATCH / - Patch data
 */
router.patch(
  '/',
  asyncHandler(async (req, res) => {
    logger.info('🛠️ Data patched:', req.body);
    res.status(200).json({ message: '✅ Data patched', data: req.body });
  }),
);

/**
 * Route: HEAD / - Check endpoint availability
 */
router.head(
  '/',
  asyncHandler(async (req, res) => {
    logger.info('🔎 HEAD request received');
    res.status(200).send();
  }),
);

/**
 * Route: OPTIONS / - Provide supported methods
 */
router.options(
  '/',
  asyncHandler(async (req, res) => {
    logger.info('⚙️ OPTIONS request received');
    res
      .status(204)
      .set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      )
      .send();
  }),
);

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
