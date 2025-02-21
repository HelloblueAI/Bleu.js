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
import AdvancedCircuitBreaker from '../core/circuit-breaker.mjs';
import metrics from '../core/metrics.mjs';


const circuitBreaker = new AdvancedCircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 30000,
  timeout: 5000,
  bulkhead: 20,
  retryPolicy: {
    maxRetries: 3,
    backoffStrategy: 'exponential'
  },
  metrics: {
    enabled: true,
    detailedErrors: true
  }
});

export function setupBroadcastRoute(app, wsManager) {
  app.post('/api/broadcast', async (req, res) => {
    const requestId = req.headers['x-request-id'] || uuidv4();
    const startTime = performance.now();

    // Add request tracking
    metrics.trackRequest(startTime, true, {
      endpoint: '/api/broadcast',
      circuitBreaker: circuitBreaker
    });

    logger.info(`[${requestId}] 🔊 Broadcast request received`, {
      timestamp: new Date().toISOString(),
      body: req.body
    });

    try {
      const validationResult = validateBroadcastInput(req.body);
      if (!validationResult.isValid) {
        throw new Error(validationResult.error);
      }

      const result = await circuitBreaker.execute(
        async () => processBroadcast(wsManager, req.body, requestId),
        {
          cacheKey: null,
          requestId,
          timeout: 10000 // Increased timeout for large broadcasts
        }
      );

      await sendSuccessResponse(res, result, startTime, requestId);
    } catch (error) {
      await handleBroadcastError(error, res, startTime, requestId);
    }
  });
}

function validateBroadcastInput(body) {
  const { message, filter } = body;

  const validationErrors = [];

  if (!message || typeof message !== 'string' || message.trim() === '') {
    validationErrors.push('Message is required and must be a non-empty string.');
  }

  if (filter) {
    if (typeof filter !== 'object') {
      validationErrors.push('Filter must be an object if provided.');
    } else {
      // Validate filter structure
      Object.entries(filter).forEach(([key, value]) => {
        if (!['ip', 'userId', 'role', 'group'].includes(key)) {
          validationErrors.push(`Invalid filter key: ${key}`);
        }
      });
    }
  }

  if (message && message.length > 1000000) {
    validationErrors.push('Message exceeds maximum length of 1MB.');
  }

  return {
    isValid: validationErrors.length === 0,
    error: validationErrors.join(' ')
  };
}



async function processBroadcast(wsManager, { message, filter }, requestId) {
  metrics.incrementCounter('broadcast.attempts');

  let filterFunction = null;
  if (filter && Object.keys(filter).length > 0) {
    filterFunction = createFilterFunction(filter);
    logger.info(`[${requestId}] 🎯 Applying filter`, {
      filter,
      activeClients: wsManager.getActiveClientCount()
    });
  }

  const recipientCount = await broadcastWithRetry(
    wsManager,
    message,
    filterFunction,
    requestId
  );

  // Enhanced metrics tracking
  metrics.trackRequest(performance.now(), true, {
    endpoint: 'broadcast.success',
    metadata: {
      recipients: recipientCount,
      messageSize: message.length,
      filtered: !!filterFunction
    }
  });

  return {
    recipientCount,
    messageLength: message.length,
    hasFilter: !!filterFunction,
    activeClients: wsManager.getActiveClientCount()
  };
}

function createFilterFunction(filter) {
  const compiledFilters = Object.entries(filter).map(([key, value]) => {
    if (key === 'ip' && typeof value === 'string') {
      const ipRegex = new RegExp(value.replace(/\*/g, '.*'));
      return client => ipRegex.test(client[key]);
    }
    if (Array.isArray(value)) {
      return client => value.includes(client[key]);
    }
    return client => client[key] === value;
  });

  return (client) => {
    try {
      return compiledFilters.every(filterFn => filterFn(client));
    } catch (error) {
      logger.warn('Filter function error', {
        error: error.message,
        filter,
        clientId: client.id
      });
      return false;
    }
  };
}

async function broadcastWithRetry(
  wsManager,
  message,
  filterFunction,
  requestId,
  maxRetries = 3
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const count = wsManager.broadcast(message, filterFunction);
      if (attempt > 1) {
        logger.info(`[${requestId}] Broadcast succeeded on attempt ${attempt}`);
      }
      return count;
    } catch (error) {
      logger.warn(`[${requestId}] Broadcast attempt ${attempt} failed`, {
        error: error.message,
        attempt,
        maxRetries
      });

      if (attempt === maxRetries) throw error;

      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function sendSuccessResponse(res, result, startTime, requestId) {
  const duration = performance.now() - startTime;

  // Enhanced metrics
  metrics.trackRequest(startTime, true, {
    endpoint: 'broadcast.complete',
    duration,
    metadata: result
  });

  logger.info(`[${requestId}] 📡 Broadcast completed`, {
    ...result,
    duration: `${duration.toFixed(2)}ms`,
    timestamp: new Date().toISOString()
  });

  return res.status(200).json({
    success: true,
    message: 'Broadcast sent successfully!',
    metadata: {
      requestId,
      timestamp: new Date().toISOString(),
      duration: `${duration.toFixed(2)}ms`,
      recipientCount: result.recipientCount,
      activeClients: result.activeClients,
      messageStats: {
        length: result.messageLength,
        filtered: result.hasFilter
      },
      circuitBreaker: {
        state: circuitBreaker.state,
        metrics: metrics.getMetrics()
      }
    }
  });
}

async function handleBroadcastError(error, res, startTime, requestId) {
  const duration = performance.now() - startTime;

  metrics.trackRequest(startTime, false, {
    endpoint: 'broadcast.error',
    error: error.message,
    duration
  });

  logger.error(`[${requestId}] ❌ Broadcast failed`, {
    error: error.message,
    stack: error.stack,
    duration: `${duration.toFixed(2)}ms`,
    circuitBreakerState: circuitBreaker.state
  });

  return res.status(500).json({
    success: false,
    error: error.message,
    metadata: {
      requestId,
      timestamp: new Date().toISOString(),
      duration: `${duration.toFixed(2)}ms`,
      circuitBreaker: {
        state: circuitBreaker.state,
        metrics: metrics.getMetrics()
      }
    }
  });
}
