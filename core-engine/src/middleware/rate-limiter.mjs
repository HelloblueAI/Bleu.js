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
import metrics from '../core/metrics.mjs';
import { logger } from '../config/logger.mjs';
import {
  RATE_LIMIT_WINDOW,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WHITELIST,
} from '../config/constants.mjs';

class RateLimiter {
  #store;
  #cleanupInterval;
  #options;
  #adaptiveLimits;

  constructor() {
    this.#store = new Map();
    this.#adaptiveLimits = new Map();

    this.#options = {
      window: RATE_LIMIT_WINDOW,
      maxRequests: RATE_LIMIT_MAX_REQUESTS,
      whitelist: RATE_LIMIT_WHITELIST,
      blacklist: new Set(),
      slidingWindowSize: 1000,
      windowCount: 60,
      backoff: {
        enabled: true,
        multiplier: 2,
        maxDelay: 3600000, // 1 hour
      },
      adaptiveThreshold: 5, // Detect suspicious behavior after X violations
      predictionWindow: 5, // Check user behavior for last 5 requests
    };

    this.#startCleanup();
  }

  middleware(options = {}) {
    this.#options = { ...this.#options, ...options };

    return async (req, res, next) => {
      const startTime = performance.now();
      const clientIp = this.#getClientIp(req);

      try {
        if (this.#options.whitelist.includes(clientIp)) return next();
        if (this.#options.blacklist.has(clientIp))
          return this.#sendBlockedResponse(res);

        const key = this.#generateKey(clientIp, req);
        const result = await this.#checkRateLimit(key, clientIp);

        this.#updateMetrics(result, clientIp, startTime);
        this.#setRateLimitHeaders(res, result);

        if (!result.allowed) {
          if (result.backoff) return this.#sendBackoffResponse(res, result);
          return this.#sendRateLimitResponse(res, result);
        }

        res.on('finish', () => {
          const duration = performance.now() - startTime;
          this.#trackRequestTiming(duration, clientIp, req.path);
        });

        next();
      } catch (error) {
        logger.error('Rate limiter error:', {
          error,
          clientIp,
          path: req.path,
          method: req.method,
        });
        next(error);
      }
    };
  }

  #generateKey(clientIp, req) {
    return `${clientIp}:${req.method}:${req.path}:${Math.floor(Date.now() / this.#options.slidingWindowSize)}`;
  }

  #getClientIp(req) {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = forwardedFor.split(',').map((ip) => ip.trim());
      return ips.find((ip) => !this.#isPrivateIP(ip)) || ips[0];
    }
    return req.socket.remoteAddress;
  }

  #isPrivateIP(ip) {
    return /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(ip);
  }

  async #checkRateLimit(key, clientIp) {
    const now = Date.now();
    const record = this.#store.get(key) || {
      timestamps: [],
      blocked: false,
      blockExpiry: 0,
      attempts: 0,
    };

    if (record.blocked && now < record.blockExpiry) {
      return {
        allowed: false,
        remaining: 0,
        reset: Math.ceil((record.blockExpiry - now) / 1000),
        blocked: true,
        backoff: true,
        nextAttempt: new Date(record.blockExpiry).toISOString(),
      };
    }

    const windowStart = now - this.#options.window;
    record.timestamps = record.timestamps.filter((time) => time > windowStart);

    const adaptiveLimit = this.#getAdaptiveLimit(clientIp);
    if (record.timestamps.length >= adaptiveLimit) {
      record.attempts++;
      record.blocked = true;
      record.blockExpiry = now + this.#calculateBackoff(record.attempts);
      this.#store.set(key, record);

      return {
        allowed: false,
        remaining: 0,
        reset: Math.ceil((record.blockExpiry - now) / 1000),
        blocked: true,
        attempts: record.attempts,
        nextAttempt: new Date(record.blockExpiry).toISOString(),
      };
    }

    record.timestamps.push(now);
    record.attempts = Math.max(0, record.attempts - 1);
    this.#store.set(key, record);

    return {
      allowed: true,
      remaining: adaptiveLimit - record.timestamps.length,
      reset: Math.ceil(
        (record.timestamps[0] + this.#options.window - now) / 1000,
      ),
      blocked: false,
      attempts: record.attempts,
    };
  }

  #calculateBackoff(attempts) {
    if (!this.#options.backoff.enabled) return this.#options.window;
    return Math.min(
      this.#options.window *
        Math.pow(this.#options.backoff.multiplier, attempts - 1),
      this.#options.backoff.maxDelay,
    );
  }

  #setRateLimitHeaders(res, result) {
    res.setHeader('X-RateLimit-Limit', this.#getAdaptiveLimit(res.req.ip));
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.reset);
    if (result.blocked) res.setHeader('Retry-After', result.reset);
  }

  #sendRateLimitResponse(res, result) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      retryAfter: result.reset,
      message: `Too many requests. Please try again in ${result.reset} seconds.`,
      nextAttempt: result.nextAttempt,
    });
  }

  #sendBackoffResponse(res, result) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded - backoff in effect',
      retryAfter: result.reset,
      message: `Too many attempts. Please wait until ${result.nextAttempt}`,
      attempts: result.attempts,
      nextAttempt: result.nextAttempt,
    });
  }

  #sendBlockedResponse(res) {
    return res.status(403).json({
      success: false,
      error: 'IP blocked',
      message: 'Your IP address has been blocked.',
    });
  }

  #updateMetrics(result, clientIp, startTime) {
    const duration = performance.now() - startTime;
    metrics.trackRequest(startTime, result.allowed, {
      endpoint: 'rate_limiter',
      clientIp,
      duration,
      blocked: result.blocked,
      attempts: result.attempts,
    });
  }

  #trackRequestTiming(duration, clientIp, path) {
    metrics.record('rate_limit.request_duration', duration, { clientIp, path });
  }

  #startCleanup() {
    this.#cleanupInterval = setInterval(() => {
      const now = Date.now();
      const stats = { cleaned: 0, remaining: 0, blocked: 0 };

      this.#store.forEach((record, key) => {
        if (this.#shouldCleanRecord(record, now)) {
          this.#store.delete(key);
          stats.cleaned++;
        } else {
          stats.remaining++;
          if (record.blocked) stats.blocked++;
        }
      });

      metrics.gauge('rate_limit.active_records', stats.remaining);
      metrics.gauge('rate_limit.blocked_records', stats.blocked);
      metrics.counter('rate_limit.cleaned_records', stats.cleaned);
    }, this.#options.window / 2);
  }

  #getAdaptiveLimit(clientIp) {
    return this.#adaptiveLimits.get(clientIp) || this.#options.maxRequests;
  }

  #shouldCleanRecord(record, now) {
    return (
      record.timestamps.length === 0 &&
      (!record.blocked || now >= record.blockExpiry)
    );
  }

  destroy() {
    if (this.#cleanupInterval) clearInterval(this.#cleanupInterval);
    this.#store.clear();
    logger.info('Rate limiter destroyed');
  }
}

export { RateLimiter };
