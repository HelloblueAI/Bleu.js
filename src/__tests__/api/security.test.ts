import { SecurityManager, SecurityConfig, Request } from '../../security/securityManager';
import { Logger } from '../../utils/logger';
import { SecurityError } from '../../utils/errors';
import * as jwt from 'jsonwebtoken';

jest.mock('../../utils/logger');
jest.mock('jsonwebtoken');

describe('SecurityManager', () => {
  let securityManager: SecurityManager;
  let mockLogger: jest.Mocked<Logger>;
  let config: SecurityConfig;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn()
    } as any;

    config = {
      jwtSecret: 'test-secret',
      apiKeys: ['valid-api-key'],
      allowedOrigins: ['https://allowed-origin.com'],
      rateLimits: {
        maxRequests: 100,
        windowMs: 60000
      }
    };

    securityManager = new SecurityManager(config, mockLogger);
  });

  describe('initialization', () => {
    it('should initialize successfully with valid config', () => {
      expect(() => new SecurityManager(config, mockLogger)).not.toThrow();
      expect(mockLogger.info).toHaveBeenCalledWith('SecurityManager initialized successfully');
    });

    it('should throw error with invalid config', () => {
      expect(() => new SecurityManager(null as any, mockLogger)).toThrow(SecurityError);
      expect(() => new SecurityManager({} as any, mockLogger)).toThrow(SecurityError);
    });
  });

  describe('validateRequest', () => {
    it('should validate request with valid API key', async () => {
      const request: Request = {
        headers: {
          'x-api-key': 'valid-api-key'
        }
      };

      const result = await securityManager.validateRequest(request);
      expect(result.isValid).toBe(true);
    });

    it('should reject request without API key', async () => {
      const request: Request = {
        headers: {}
      };

      const result = await securityManager.validateRequest(request);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Authentication required');
    });

    it('should reject request with invalid API key', async () => {
      const request: Request = {
        headers: {
          'x-api-key': 'invalid-api-key'
        }
      };

      const result = await securityManager.validateRequest(request);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });

    it('should validate JWT token if present', async () => {
      const request: Request = {
        headers: {
          'x-api-key': 'valid-api-key',
          authorization: 'Bearer valid-token'
        }
      };

      (jwt.verify as jest.Mock).mockResolvedValueOnce({ userId: '123' });

      const result = await securityManager.validateRequest(request);
      expect(result.isValid).toBe(true);
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
    });

    it('should reject request with invalid JWT token', async () => {
      const request: Request = {
        headers: {
          'x-api-key': 'valid-api-key',
          authorization: 'Bearer invalid-token'
        }
      };

      (jwt.verify as jest.Mock).mockRejectedValueOnce(new Error('Invalid token'));

      const result = await securityManager.validateRequest(request);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid token');
    });
  });

  describe('validateCORS', () => {
    it('should validate allowed origin', () => {
      const request: Request = {
        headers: {
          origin: 'https://allowed-origin.com'
        }
      };

      const result = securityManager.validateCORS(request);
      expect(result.isValid).toBe(true);
    });

    it('should reject disallowed origin', () => {
      const request: Request = {
        headers: {
          origin: 'https://disallowed-origin.com'
        }
      };

      const result = securityManager.validateCORS(request);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid origin');
    });
  });

  describe('sanitizeError', () => {
    it('should sanitize error message', () => {
      const error = new Error('Sensitive error message');
      error.stack = 'Sensitive stack trace';

      const sanitized = securityManager.sanitizeError(error);
      expect(sanitized.message).toBe('An unexpected error occurred');
      expect(sanitized.stack).toBeUndefined();
    });

    it('should throw error when no error object provided', () => {
      expect(() => securityManager.sanitizeError(null as any)).toThrow(SecurityError);
    });
  });

  describe('rate limiting', () => {
    it('should enforce rate limits', async () => {
      const request: Request = {
        headers: {
          'x-api-key': 'valid-api-key'
        }
      };

      // Make maxRequests + 1 requests
      for (let i = 0; i < config.rateLimits.maxRequests; i++) {
        const result = await securityManager.validateRequest(request);
        expect(result.isValid).toBe(true);
      }

      const result = await securityManager.validateRequest(request);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });

    it('should reset rate limit for client', async () => {
      const clientId = 'valid-api-key';
      
      // First hit the rate limit
      const request: Request = {
        headers: {
          'x-api-key': clientId
        }
      };

      for (let i = 0; i < config.rateLimits.maxRequests + 1; i++) {
        await securityManager.validateRequest(request);
      }

      // Reset the rate limit
      securityManager.resetRateLimit(clientId);

      // Should be able to make requests again
      const result = await securityManager.validateRequest(request);
      expect(result.isValid).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should cleanup successfully', async () => {
      await expect(securityManager.cleanup()).resolves.not.toThrow();
      expect(mockLogger.info).toHaveBeenCalledWith('SecurityManager cleanup completed');
    });
  });
}); 