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
import { metrics } from '../core/metrics.mjs';
import { CodeGenerator } from '../core/service-generator.mjs';
import { AdvancedCircuitBreaker } from '../core/circuit-breaker.mjs';

const ALLOWED_TYPES = [
  'service',
  'controller',
  'repository',
  'model',
  'interface',
  'factory',
];

const circuitBreaker = new AdvancedCircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 30000,
  timeout: 5000
});

export function setupGenerateEggRoute(app) {
  app.post('/api/generate-egg', async (req, res) => {
    const requestId = req.headers['x-request-id'] || uuidv4();
    const startTime = performance.now();

    logger.info(`[${requestId}] 🔥 Incoming request: /api/generate-egg`, {
      body: req.body,
      timestamp: new Date().toISOString()
    });

    try {
      // Validate input
      const validationResult = await validateInput(req.body);
      if (!validationResult.isValid) {
        throw new Error(validationResult.error);
      }

      // Generate code with circuit breaker protection
      const generatedCode = await circuitBreaker.execute(async () => {
        const { type, parameters } = req.body;
        return await generateCode(type, parameters, requestId);
      });

      // Send response
      await sendSuccessResponse(res, generatedCode, req.body, startTime, requestId);

    } catch (error) {
      await handleError(error, res, startTime, requestId);
    }
  });
}

async function validateInput(body) {
  const { type, parameters } = body;

  if (!type || !parameters) {
    return {
      isValid: false,
      error: "Missing required fields: 'type' or 'parameters'."
    };
  }

  if (!ALLOWED_TYPES.includes(type)) {
    return {
      isValid: false,
      error: `Invalid type: '${type}'. Supported types: ${ALLOWED_TYPES.join(', ')}`
    };
  }

  if (!parameters.name || typeof parameters.name !== 'string') {
    return {
      isValid: false,
      error: "Invalid or missing 'name' parameter."
    };
  }

  if (!Array.isArray(parameters.methods) || parameters.methods.length === 0) {
    return {
      isValid: false,
      error: "'methods' must be a non-empty array."
    };
  }

  return { isValid: true };
}

async function generateCode(type, parameters, requestId) {
  const sanitizedName = CodeGenerator.sanitizeName(parameters.name);

  if (sanitizedName !== parameters.name) {
    logger.warn(`[${requestId}] ⚠️ Name sanitized`, {
      original: parameters.name,
      sanitized: sanitizedName
    });
  }

  const generatedCode = await CodeGenerator.generateClass(type, {
    ...parameters,
    name: sanitizedName
  });

  const responseSize = Buffer.byteLength(JSON.stringify({ code: generatedCode }), 'utf8');
  if (responseSize > 5_000_000) {
    throw new Error("Generated response is too large. Try reducing output size.");
  }

  return generatedCode;
}

async function sendSuccessResponse(res, code, request, startTime, requestId) {
  const duration = performance.now() - startTime;
  const { type, parameters } = request;

  metrics.record('generateEgg.duration', duration, {
    type,
    methodCount: parameters.methods.length
  });

  logger.info(`[${requestId}] ✅ Code generation SUCCESS`, {
    type,
    className: parameters.name,
    methodCount: parameters.methods.length,
    duration: `${duration.toFixed(2)}ms`,
  });

  return res.status(200).json({
    success: true,
    code,
    metadata: {
      requestId,
      generatedAt: new Date().toISOString(),
      duration: `${duration.toFixed(2)}ms`,
      engineVersion: process.env.ENGINE_VERSION || 'bleu.js v.1.1.0',
      type,
      className: parameters.name,
      methodCount: parameters.methods.length,
      nodeVersion: process.version,
      platform: process.platform
    },
  });
}

async function handleError(error, res, startTime, requestId) {
  const duration = performance.now() - startTime;

  metrics.record('generateEgg.error', duration, {
    error: error.message
  });

  logger.error(`[${requestId}] ❌ Code generation FAILED`, {
    error: error.message,
    stack: error.stack
  });

  return res.status(400).json({
    success: false,
    error: error.message,
    metadata: {
      requestId,
      timestamp: new Date().toISOString(),
      duration: `${duration.toFixed(2)}ms`,
    },
  });
}
