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
import { AdvancedCircuitBreaker } from '../core/circuit-breaker.mjs';

const circuitBreaker = new AdvancedCircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 30000,
  timeout: 5000
});

export function setupBroadcastRoute(app, wsManager) {
  app.post('/api/broadcast', async (req, res) => {
    const requestId = req.headers['x-request-id'] || uuidv4();
    const startTime = performance.now();

    logger.info(`[${requestId}] 🔊 Broadcast request received`, {
      timestamp: new Date().toISOString()
    });

    try {
      // Input validation
      const validationResult = validateBroadcastInput(req.body);
      if (!validationResult.isValid) {
        throw new Error(validationResult.error);
      }

      // Process broadcast with circuit breaker protection
      const result = await circuitBreaker.execute(async () => {
        return await processBroadcast(wsManager, req.body, requestId);
      });

      // Send success response
      await sendSuccessResponse(res, result, startTime, requestId);

    } catch (error) {
      await handleBroadcastError(error, res, startTime, requestId);
    }
  });
}

function validateBroadcastInput(body) {
  const { message, filter } = body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return {
      isValid: false,
      error: 'Message is required and must be a non-empty string.'
    };
  }

  if (filter && typeof filter !== 'object') {
    return {
      isValid: false,
      error: 'Filter must be an object if provided.'
    };
  }

  if (message.length > 1000000) {
    return {
      isValid: false,
      error: 'Message exceeds maximum length of 1MB.'
    };
  }

  return { isValid: true };
}

async function processBroadcast(wsManager, { message, filter }, requestId) {
  let filterFunction = null;

  if (filter && Object.keys(filter).length > 0) {
    filterFunction = createFilterFunction(filter);
    logger.info(`[${requestId}] 🎯 Applying filter`, { filter });
  }

  const recipientCount = await broadcastWithRetry(wsManager, message, filterFunction);

  metrics.counter('broadcast.messages_sent', recipientCount);
  metrics.gauge('broadcast.active_clients', wsManager.getActiveClientCount());

  return {
    recipientCount,
    messageLength: message.length,
    hasFilter: !!filterFunction
  };
}

function createFilterFunction(filter) {
  return (client) => {
    try {
      return Object.entries(filter).every(([key, value]) => {
        if (key === 'ip' && value instanceof RegExp) {
          return value.test(client[key]);
        }
        return client[key] === value;
      });
    } catch (error) {
      logger.warn('Filter function error', { error: error.message });
      return false;
    }
  };
}

async function broadcastWithRetry(wsManager, message, filterFunction, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const count = wsManager.broadcast(message, filterFunction);
      if (attempt > 1) {
        logger.info(`Broadcast succeeded on attempt ${attempt}`);
      }
      return count;
    } catch (error) {
      lastError = error;
      logger.warn(`Broadcast attempt ${attempt} failed`, { error: error.message });
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  throw lastError;
}

async function sendSuccessResponse(res, result, startTime, requestId) {
  const duration = performance.now() - startTime;

  metrics.record('broadcast.duration', duration, {
    recipients: result.recipientCount,
    hasFilter: result.hasFilter
  });

  logger.info(`[${requestId}] 📡 Broadcast completed`, {
    ...result,
    duration: `${duration.toFixed(2)}ms`
  });

  return res.status(200).json({
    success: true,
    message: 'Broadcast sent successfully!',
    metadata: {
      requestId,
      timestamp: new Date().toISOString(),
      duration: `${duration.toFixed(2)}ms`,
      recipientCount: result.recipientCount,
      messageStats: {
        length: result.messageLength,
        filtered: result.hasFilter
      }
    }
  });
}

async function handleBroadcastError(error, res, startTime, requestId) {
  const duration = performance.now() - startTime;

  metrics.record('broadcast.error', duration, {
    error: error.message
  });

  logger.error(`[${requestId}] ❌ Broadcast failed`, {
    error: error.message,
    stack: error.stack,
    duration: `${duration.toFixed(2)}ms`
  });

  return res.status(500).json({
    success: false,
    error: error.message,
    metadata: {
      requestId,
      timestamp: new Date().toISOString(),
      duration: `${duration.toFixed(2)}ms`
    }
  });
}
