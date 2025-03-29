import { createLogger } from '../utils/logger';

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private readonly config: RateLimitConfig;
  private readonly limits: Map<string, RateLimitInfo>;
  private readonly logger = createLogger('RateLimiter');

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.limits = new Map();
  }

  async initialize(): Promise<void> {
    this.logger.info('Rate limiter initialized');
  }

  checkLimit(clientId: string): boolean {
    const now = Date.now();
    const limitInfo = this.limits.get(clientId);

    if (!limitInfo) {
      // First request from this client
      this.limits.set(clientId, {
        count: 1,
        resetTime: now + this.config.windowMs
      });
      return true;
    }

    if (now > limitInfo.resetTime) {
      // Reset window has passed
      this.limits.set(clientId, {
        count: 1,
        resetTime: now + this.config.windowMs
      });
      return true;
    }

    if (limitInfo.count >= this.config.max) {
      this.logger.warn(`Rate limit exceeded for client: ${clientId}`);
      return false;
    }

    // Increment count
    limitInfo.count++;
    return true;
  }

  async resetLimit(clientId: string): Promise<void> {
    this.limits.delete(clientId);
    this.logger.info(`Rate limit reset for client: ${clientId}`);
  }

  getLimitInfo(clientId: string): RateLimitInfo | undefined {
    return this.limits.get(clientId);
  }
} 