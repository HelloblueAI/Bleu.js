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

import { performance } from 'perf_hooks';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger.mjs';
import metrics from '../core/metrics.mjs';
import ServiceGenerator from '../core/service-generator.mjs';
import AdvancedCircuitBreaker from '../core/circuit-breaker.mjs';

// Constants
const ALLOWED_TYPES = [
  'service',
  'controller',
  'repository',
  'model',
  'interface',
  'factory',
];

const MAX_RESPONSE_SIZE = 5_000_000; // 5MB
const DEFAULT_TIMEOUT = 5000;

// Initialize services
const codeGenerator = new ServiceGenerator(metrics);
const circuitBreaker = new AdvancedCircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 30000,
  timeout: DEFAULT_TIMEOUT,
  bulkhead: 10,
  retryPolicy: {
    maxRetries: 2,
    backoffStrategy: 'exponential',
  },
});

export function setupGenerateEggRoute(app) {
  app.post('/api/generate-egg', async (req, res) => {
    const requestId = req.headers['x-request-id'] || uuidv4();
    const startTime = performance.now();

    // Track request
    metrics.trackRequest(startTime, true, {
      endpoint: '/api/generate-egg',
      requestId,
    });

    logger.info(`[${requestId}] 🔥 Code generation request received`, {
      type: req.body.type,
      name: req.body.parameters?.name,
      timestamp: new Date().toISOString(),
    });

    try {
      const validationResult = await validateInput(req.body);
      if (!validationResult.isValid) {
        throw new Error(validationResult.error);
      }

      const generatedCode = await circuitBreaker.execute(
        async () => generateCode(req.body, requestId),
        {
          requestId,
          timeout: 10000, // Increased timeout for complex generations
          retries: 2,
        },
      );

      await sendSuccessResponse(
        res,
        generatedCode,
        req.body,
        startTime,
        requestId,
      );
    } catch (error) {
      await handleError(error, res, startTime, requestId);
    }
  });
}

async function validateInput(body) {
  const { type, parameters } = body;
  const errors = [];

  // Required fields
  if (!type || !parameters) {
    errors.push("Missing required fields: 'type' or 'parameters'");
  }

  // Type validation
  if (type && !ALLOWED_TYPES.includes(type)) {
    errors.push(
      `Invalid type: '${type}'. Allowed types: ${ALLOWED_TYPES.join(', ')}`,
    );
  }

  // Parameters validation
  if (parameters) {
    if (!parameters.name || typeof parameters.name !== 'string') {
      errors.push("Invalid or missing 'name' parameter");
    }

    if (!Array.isArray(parameters.methods)) {
      errors.push("'methods' must be an array");
    } else if (parameters.methods.length === 0) {
      errors.push("'methods' array cannot be empty");
    } else {
      // Validate each method
      parameters.methods.forEach((method, index) => {
        if (typeof method !== 'string') {
          errors.push(`Method at index ${index} must be a string`);
        }
      });
    }

    // Validate name format
    if (parameters.name && !/^[a-zA-Z]\w*$/.test(parameters.name)) {
      errors.push(
        'Name must start with a letter and contain only letters, numbers, and underscores',
      );
    }
  }

  return {
    isValid: errors.length === 0,
    error: errors.join('. '),
  };
}

async function generateCode(request, requestId) {
  const { type, parameters } = request;
  const startTime = performance.now();

  try {
    // Sanitize input
    const sanitizedName = ServiceGenerator.sanitizeName(parameters.name);
    if (sanitizedName !== parameters.name) {
      logger.warn(`[${requestId}] ⚠️ Name sanitized`, {
        original: parameters.name,
        sanitized: sanitizedName,
      });
    }

    // Generate code
    const generatedCode = await codeGenerator.generate(type, {
      ...parameters,
      name: sanitizedName,
    });

    // Check response size
    const responseSize = Buffer.byteLength(
      JSON.stringify({ code: generatedCode }),
      'utf8',
    );
    if (responseSize > MAX_RESPONSE_SIZE) {
      throw new Error(
        `Generated response exceeds size limit of ${MAX_RESPONSE_SIZE / 1_000_000}MB`,
      );
    }

    // Track metrics
    metrics.trackRequest(startTime, true, {
      endpoint: 'code.generation',
      type,
      duration: performance.now() - startTime,
    });

    return generatedCode;
  } catch (error) {
    metrics.trackRequest(startTime, false, {
      endpoint: 'code.generation',
      type,
      error: error.message,
    });
    throw error;
  }
}

async function sendSuccessResponse(res, code, request, startTime, requestId) {
  const duration = performance.now() - startTime;
  const { type, parameters } = request;

  const metadata = {
    requestId,
    generatedAt: new Date().toISOString(),
    duration: `${duration.toFixed(2)}ms`,
    stats: {
      type,
      className: parameters.name,
      methodCount: parameters.methods.length,
      codeSize: Buffer.byteLength(code, 'utf8'),
    },
    environment: {
      engineVersion: process.env.ENGINE_VERSION || '1.1.0',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    metrics: metrics.getMetrics(),
  };

  logger.info(`[${requestId}] ✅ Code generation completed`, {
    ...metadata.stats,
    duration: metadata.duration,
  });

  return res.status(200).json({
    success: true,
    code,
    metadata,
  });
}

async function handleError(error, res, startTime, requestId) {
  const duration = performance.now() - startTime;

  const errorResponse = {
    success: false,
    error: {
      message: error.message,
      type: error.name,
      code: error.code || 'GENERATION_ERROR',
    },
    metadata: {
      requestId,
      timestamp: new Date().toISOString(),
      duration: `${duration.toFixed(2)}ms`,
      metrics: metrics.getMetrics(),
    },
  };

  logger.error(`[${requestId}] ❌ Code generation failed`, {
    error: error.message,
    stack: error.stack,
    duration: `${duration.toFixed(2)}ms`,
  });

  // Determine appropriate status code
  const statusCode =
    error.statusCode || (error.message.includes('Invalid') ? 400 : 500);

  return res.status(statusCode).json(errorResponse);
}
