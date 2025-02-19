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

import { metrics } from '../core/metrics.mjs';
import { logger } from '../config/logger.mjs';
import {
  RATE_LIMIT_WINDOW,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WHITELIST
} from '../config/constants.mjs';

class RateLimiter {
  #store;
  #cleanupInterval;

  constructor() {
    this.#store = new Map();
    this.#startCleanup();
  }

  middleware(options = {}) {
    const {
      window = RATE_LIMIT_WINDOW,
      maxRequests = RATE_LIMIT_MAX_REQUESTS,
      whitelist = RATE_LIMIT_WHITELIST
    } = options;

    return (req, res, next) => {
      const clientIp = this.#getClientIp(req);


      if (whitelist.includes(clientIp)) {
        return next();
      }

      const now = Date.now();
      const key = this.#generateKey(clientIp, req);

      try {
        const result = this.#checkRateLimit(key, now, window, maxRequests);
        this.#updateMetrics(result, clientIp);

        if (!result.allowed) {
          return this.#sendRateLimitResponse(res, result);
        }


        this.#setRateLimitHeaders(res, result);
        next();
      } catch (error) {
        logger.error('Rate limiter error:', { error, clientIp });
        next(error);
      }
    };
  }

  #generateKey(clientIp, req) {
    return `${clientIp}_${req.method}_${req.path}`;
  }

  #getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0].trim()
      || req.socket.remoteAddress;
  }

  #checkRateLimit(key, now, window, maxRequests) {
    const record = this.#store.get(key) || {
      timestamps: [],
      blocked: false,
      blockExpiry: 0
    };

    if (record.blocked && now < record.blockExpiry) {
      return {
        allowed: false,
        remaining: 0,
        reset: Math.ceil((record.blockExpiry - now) / 1000),
        blocked: true
      };
    }

    record.timestamps = record.timestamps.filter(time => now - time < window);

    const count = record.timestamps.length;
    if (count >= maxRequests) {
      record.blocked = true;
      record.blockExpiry = now + window;
      this.#store.set(key, record);

      return {
        allowed: false,
        remaining: 0,
        reset: Math.ceil(window / 1000),
        blocked: true
      };
    }

    record.timestamps.push(now);
    this.#store.set(key, record);

    return {
      allowed: true,
      remaining: maxRequests - record.timestamps.length,
      reset: Math.ceil((record.timestamps[0] + window - now) / 1000),
      blocked: false
    };
  }

  #setRateLimitHeaders(res, result) {
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.reset);
  }

  #sendRateLimitResponse(res, result) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      retryAfter: result.reset,
      message: `Too many requests. Please try again in ${result.reset} seconds.`
    });
  }

  #updateMetrics(result, clientIp) {
    metrics.counter('rate_limit.requests', 1, { clientIp });
    if (!result.allowed) {
      metrics.counter('rate_limit.blocked', 1, { clientIp });
    }
    metrics.gauge('rate_limit.remaining', result.remaining, { clientIp });
  }

  #startCleanup() {
    this.#cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleanedKeys = 0;

      this.#store.forEach((record, key) => {
        if (record.timestamps.every(time => now - time >= RATE_LIMIT_WINDOW)) {
          this.#store.delete(key);
          cleanedKeys++;
        }
      });

      metrics.gauge('rate_limit.active_keys', this.#store.size);
      metrics.counter('rate_limit.cleaned_keys', cleanedKeys);
    }, RATE_LIMIT_WINDOW);
  }

  destroy() {
    if (this.#cleanupInterval) {
      clearInterval(this.#cleanupInterval);
    }
    this.#store.clear();
  }
}

export const rateLimiter = new RateLimiter();
