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

import { logger } from '../config/logger.mjs';

/**
 * Middleware modules
 */
let rateLimiter, requestTracker;

try {
  const { RateLimiter } = await import('./rate-limiter.mjs');
  rateLimiter = new RateLimiter();
  requestTracker = (await import('./request-tracker.mjs')).default;

  if (typeof rateLimiter.middleware !== 'function') {
    throw new Error('❌ rateLimiter is not a valid function.');
  }
  if (typeof requestTracker !== 'function') {
    throw new Error('❌ requestTracker is not a valid function.');
  }
} catch (error) {
  logger.error('❌ Failed to import middleware:', error);
}

/**
 * Applies all middleware to the Express app.
 * @param {import('express').Express} app - Express application instance
 */
export function setupMiddleware(app) {
  if (!app || typeof app.use !== 'function') {
    throw new Error(
      '❌ Invalid Express app instance provided to setupMiddleware.',
    );
  }

  try {
    logger.info('🔧 Applying middleware...');

    if (rateLimiter) {
      app.use(rateLimiter.middleware());
      logger.info('✅ Applied rateLimiter.');
    } else {
      logger.warn('⚠️ Skipping rateLimiter due to invalid function.');
    }

    if (requestTracker) {
      app.use(requestTracker);
      logger.info('✅ Applied requestTracker.');
    } else {
      logger.warn('⚠️ Skipping requestTracker due to invalid function.');
    }

    logger.info('✅ Middleware setup completed.');
  } catch (error) {
    logger.error('❌ Middleware setup failed:', error);
  }
}

/**
 * Dynamically loads middleware modules.
 * @param {string} middlewareName - Name of the middleware to load.
 * @returns {Promise<Function>} - The middleware function.
 */
export const lazyLoadMiddleware = async (middlewareName) => {
  const middlewareMap = {
    rateLimiter: './rate-limiter.mjs',
    requestTracker: './request-tracker.mjs',
  };

  if (!middlewareMap[middlewareName]) {
    const errorMsg = `❌ Middleware '${middlewareName}' not found. Available: ${Object.keys(middlewareMap).join(', ')}`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    logger.info(`📦 Loading middleware '${middlewareName}' dynamically...`);
    const module = await import(middlewareMap[middlewareName]);

    if (middlewareName === 'rateLimiter') {
      const { RateLimiter } = module;
      return new RateLimiter().middleware();
    }

    if (typeof module.default !== 'function') {
      throw new Error(
        `⚠️ Middleware '${middlewareName}' does not export a default function.`,
      );
    }

    logger.info(`✅ Successfully loaded middleware '${middlewareName}'.`);
    return module.default;
  } catch (error) {
    logger.error(`❌ Error loading middleware '${middlewareName}':`, error);
    throw error;
  }
};
