import { SecurityError } from '../errors/securityError';

export interface SecurityValidatorConfig {
  maxRequestSize?: number;
  allowedMethods?: string[];
  allowedOrigins?: string[];
  rateLimitRequests?: number;
  rateLimitWindow?: number;
}

export class SecurityValidator {
  private config: SecurityValidatorConfig;

  constructor(config: SecurityValidatorConfig = {}) {
    this.config = {
      maxRequestSize: config.maxRequestSize || 10 * 1024 * 1024, // 10MB
      allowedMethods: config.allowedMethods || ['GET', 'POST', 'PUT', 'DELETE'],
      allowedOrigins: config.allowedOrigins || ['*'],
      rateLimitRequests: config.rateLimitRequests || 100,
      rateLimitWindow: config.rateLimitWindow || 60 * 1000 // 1 minute
    };
  }

  validateRequest(request: any): void {
    this.validateRequestSize(request);
    this.validateMethod(request);
    this.validateOrigin(request);
  }

  private validateRequestSize(request: any): void {
    const size = request.headers['content-length'] || 0;
    if (size > this.config.maxRequestSize) {
      throw new SecurityError('Request size exceeds maximum allowed size');
    }
  }

  private validateMethod(request: any): void {
    if (!this.config.allowedMethods.includes(request.method)) {
      throw new SecurityError('HTTP method not allowed');
    }
  }

  private validateOrigin(request: any): void {
    const origin = request.headers.origin;
    if (this.config.allowedOrigins[0] !== '*' && !this.config.allowedOrigins.includes(origin)) {
      throw new SecurityError('Origin not allowed');
    }
  }

  validateToken(token: string): boolean {
    if (!token || token.length < 32) {
      throw new SecurityError('Invalid token');
    }
    return true;
  }

  validateApiKey(apiKey: string): boolean {
    if (!apiKey || apiKey.length < 32) {
      throw new SecurityError('Invalid API key');
    }
    return true;
  }
} 