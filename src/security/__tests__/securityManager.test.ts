import { SecurityManager } from '../securityManager';
import { SecurityConfig } from '../types';
import { Logger } from '../../utils/logger';
import * as jwt from 'jsonwebtoken';

describe('SecurityManager', () => {
  let securityManager: SecurityManager;
  let logger: Logger;
  let config: SecurityConfig;

  beforeEach(async () => {
    logger = new Logger('SecurityManagerTest');
    config = {
      jwtSecret: 'test-secret',
      apiKeys: ['valid-key'],
      allowedOrigins: ['http://localhost:3000'],
      rateLimits: {
        maxRequests: 100,
        windowMs: 60000
      },
      security: {
        encryption: {
          keySize: 32,
          ivSize: 16
        }
      }
    };

    securityManager = new SecurityManager(config, logger);
    await securityManager.initialize();
  });

  afterEach(async () => {
    await securityManager.cleanup();
  });

  describe('initialization', () => {
    it('should initialize with provided config', async () => {
      expect(securityManager).toBeDefined();
      // Verify initialization by checking if we can validate a request
      const mockReq = {
        headers: {
          'x-api-key': 'valid-key'
        }
      };
      const result = await securityManager.validateRequest(mockReq as any);
      expect(result.isValid).toBe(true);
    });

    it('should throw error if config is invalid', () => {
      const invalidConfig = {} as SecurityConfig;
      expect(() => new SecurityManager(invalidConfig, logger)).toThrow('Missing required security configuration');
    });
  });

  describe('request validation', () => {
    it('should validate request with valid API key', async () => {
      const mockReq = {
        headers: {
          'x-api-key': 'valid-key'
        }
      };
      const result = await securityManager.validateRequest(mockReq as any);
      expect(result.isValid).toBe(true);
    });

    it('should reject request without API key', async () => {
      const mockReq = {
        headers: {}
      };
      const result = await securityManager.validateRequest(mockReq as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Authentication required');
    });

    it('should reject request with invalid API key', async () => {
      const mockReq = {
        headers: {
          'x-api-key': 'invalid-key'
        }
      };
      const result = await securityManager.validateRequest(mockReq as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });
  });

  describe('JWT authentication', () => {
    it('should validate JWT token', async () => {
      const token = jwt.sign({ userId: 'test-user' }, config.jwtSecret);
      const result = await securityManager.validateToken(token);
      expect(result).toBeDefined();
      expect(result.userId).toBe('test-user');
    });

    it('should handle invalid JWT token', async () => {
      const invalidToken = 'invalid-token';
      await expect(securityManager.validateToken(invalidToken)).rejects.toThrow('Invalid token');
    });
  });

  describe('error handling', () => {
    it('should sanitize error messages', () => {
      const error = new Error('Test error');
      const sanitized = securityManager.sanitizeError(error);
      expect(sanitized).toBeDefined();
      expect(sanitized.message).toBe('An unexpected error occurred');
    });

    it('should handle error sanitization errors', () => {
      const error = null;
      expect(() => securityManager.sanitizeError(error)).toThrow('Error object is required');
    });
  });

  describe('cleanup', () => {
    it('should clean up resources', async () => {
      await securityManager.cleanup();
      // Verify cleanup by checking if we can't validate requests anymore
      const mockReq = {
        headers: {
          'x-api-key': 'valid-key'
        }
      };
      await expect(securityManager.validateRequest(mockReq as any)).rejects.toThrow('SecurityManager not initialized');
    });

    it('should handle cleanup errors', async () => {
      // Force a cleanup error by providing invalid state
      securityManager['initialized'] = false;
      await expect(securityManager.cleanup()).rejects.toThrow('Failed to cleanup SecurityManager');
    });
  });
}); 