import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Bleu } from '../Bleu';
import express from 'express';
import mongoose from 'mongoose';
import { Logger } from '../../utils/logger';
import { SecurityManager } from '../../security/securityManager';
import { BleuConfig } from '../../types/config';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import cors from 'cors';
import helmet from 'helmet';
import { Storage } from '../../storage/storage';
import { NLPProcessor } from '../../ai/nlp/nlpProcessor';
import { SelfLearningCore } from '../selfLearningCore';

jest.mock('express', () => {
  const mockExpress = jest.fn(() => ({
    use: jest.fn(),
    get: jest.fn(),
    listen: jest.fn().mockReturnValue({
      on: jest.fn(),
      close: jest.fn().mockImplementation(cb => cb?.())
    })
  }));
  mockExpress.json = jest.fn();
  mockExpress.urlencoded = jest.fn();
  return mockExpress;
});

jest.mock('mongoose');
jest.mock('../../utils/logger');
jest.mock('../../security/securityManager');
jest.mock('rate-limiter-flexible');
jest.mock('cors');
jest.mock('helmet');
jest.mock('../../storage/storage');
jest.mock('../../ai/nlp/nlpProcessor');
jest.mock('../selfLearningCore');

describe('Bleu', () => {
  let bleu: Bleu;
  let mockApp: any;
  let mockLogger: jest.Mocked<Logger>;
  let mockSecurityManager: jest.Mocked<SecurityManager>;
  let defaultConfig: BleuConfig;
  let mockStorage: jest.Mocked<Storage>;
  let mockNLPProcessor: jest.Mocked<NLPProcessor>;
  let mockSelfLearningCore: jest.Mocked<SelfLearningCore>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock Express app
    mockApp = {
      use: jest.fn(),
      get: jest.fn(),
      listen: jest.fn().mockReturnValue({
        on: jest.fn(),
        close: jest.fn().mockImplementation(cb => cb?.())
      })
    };
    (express as jest.Mock).mockReturnValue(mockApp);
    (express.json as jest.Mock).mockReturnValue(jest.fn());
    (express.urlencoded as jest.Mock).mockReturnValue(jest.fn());
    
    // Setup mock Logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    // Setup mock SecurityManager
    mockSecurityManager = {
      initialize: jest.fn().mockResolvedValue(undefined),
      validateRequest: jest.fn().mockReturnValue(jest.fn()),
      sanitizeError: jest.fn().mockImplementation(err => ({ message: err.message })),
      setupMiddleware: jest.fn().mockReturnValue(jest.fn())
    } as any;

    // Setup mock Storage
    mockStorage = {
      cleanup: jest.fn()
    } as any;

    // Setup mock NLPProcessor
    mockNLPProcessor = {
      processText: jest.fn().mockReturnValue('processed text'),
      cleanup: jest.fn()
    } as any;

    // Setup mock SelfLearningCore
    mockSelfLearningCore = {
      predict: jest.fn().mockReturnValue('predicted output'),
      cleanup: jest.fn()
    } as any;

    // Setup default config
    defaultConfig = {
      environment: 'development',
      security: {
        cors: {
          enabled: true,
          origin: '*',
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          allowedHeaders: ['Content-Type', 'Authorization']
        },
        rateLimit: {
          max: 100,
          windowMs: 60000
        },
        jwt: {
          enabled: true,
          secret: 'test-secret',
          expiresIn: '1h',
        },
      },
      database: {
        mongodb: {
          uri: 'mongodb://localhost:27017/bleu',
          options: {}
        }
      },
      server: {
        port: 3000
      },
      storage: {
        path: './data',
        maxSize: 1000,
        retentionDays: 30,
        compression: true,
      },
      ai: {
        model: 'gpt-4',
        maxTokens: 1000,
        temperature: 0.7,
      },
    };

    // Initialize Bleu instance
    bleu = new Bleu(defaultConfig, mockLogger);
  });

  it('should initialize with provided dependencies', () => {
    const config = bleu.getConfig();
    expect(config).toEqual(defaultConfig);
    expect(express).toHaveBeenCalled();
    expect(express.json).toHaveBeenCalled();
    expect(express.urlencoded).toHaveBeenCalledWith({ extended: true });
  });

  it('should setup security middleware', () => {
    expect(helmet).toHaveBeenCalled();
    expect(cors).toHaveBeenCalledWith(defaultConfig.security.cors);
    expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should start server and connect to MongoDB', async () => {
    mockApp.listen.mockImplementation((port: number, callback: () => void) => {
      callback?.();
      return { on: jest.fn(), close: jest.fn() };
    });

    await bleu.start();
    
    expect(mockApp.listen).toHaveBeenCalledWith(3000, expect.any(Function));
    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/bleu', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    expect(mockLogger.info).toHaveBeenCalledWith('Connected to MongoDB');
    expect(mockLogger.info).toHaveBeenCalledWith('Server running on port 3000');
  });

  it('should handle graceful shutdown', async () => {
    // Start the server first
    mockApp.listen.mockImplementation((port: number, callback: () => void) => {
      callback?.();
      return { on: jest.fn(), close: jest.fn().mockImplementation(cb => cb?.()) };
    });
    await bleu.start();

    // Test shutdown
    await bleu.stop();
    expect(mongoose.disconnect).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith('Disconnected from MongoDB');
    expect(mockLogger.info).toHaveBeenCalledWith('Server stopped');
  });

  it('should handle server start errors', async () => {
    const error = new Error('Failed to start server');
    mockApp.listen.mockImplementation(() => {
      throw error;
    });

    await expect(bleu.start()).rejects.toThrow('Failed to start server');
    expect(mockLogger.error).toHaveBeenCalledWith('Failed to start server', error);
  });

  it('should handle MongoDB connection errors', async () => {
    const error = new Error('MongoDB connection failed');
    (mongoose.connect as jest.Mock).mockRejectedValue(error);

    await expect(bleu.start()).rejects.toThrow('MongoDB connection failed');
    expect(mockLogger.error).toHaveBeenCalledWith('Failed to start server', error);
  });

  it('should handle server stop errors', async () => {
    // Start the server first
    mockApp.listen.mockImplementation((port: number, callback: () => void) => {
      callback?.();
      return {
        on: jest.fn(),
        close: jest.fn().mockImplementation(cb => cb(new Error('Failed to stop server')))
      };
    });
    await bleu.start();

    const error = new Error('Failed to stop server');
    (mongoose.disconnect as jest.Mock).mockRejectedValue(error);

    await expect(bleu.stop()).rejects.toThrow('Failed to stop server');
    expect(mockLogger.error).toHaveBeenCalledWith('Failed to stop server', error);
  });

  it('should expose app instance', () => {
    const app = bleu.getApp();
    expect(app).toBeDefined();
    expect(app).toBe(mockApp);
  });

  it('should check server running state', () => {
    expect(bleu.isServerRunning()).toBe(false);
  });

  describe('middleware setup', () => {
    it('should setup error handling middleware', () => {
      const mockApp = { use: jest.fn() };
      bleu['setupErrorHandling'](mockApp as any);
      expect(mockApp.use).toHaveBeenCalled();
    });

    it('should setup request logging middleware', () => {
      const mockApp = { use: jest.fn() };
      bleu['setupRequestLogging'](mockApp as any);
      expect(mockApp.use).toHaveBeenCalled();
    });
  });

  describe('route handlers', () => {
    it('should handle health check', async () => {
      const mockReq = {};
      const mockRes = { json: jest.fn() };
      await bleu['handleHealthCheck'](mockReq as any, mockRes as any);
      expect(mockRes.json).toHaveBeenCalledWith({ status: 'ok' });
    });

    it('should handle text processing', async () => {
      const mockReq = { body: { text: 'test' } };
      const mockRes = { json: jest.fn() };
      await bleu['handleProcessText'](mockReq as any, mockRes as any);
      expect(mockNLPProcessor.processText).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should handle prediction', async () => {
      const mockReq = { body: { input: 'test' } };
      const mockRes = { json: jest.fn() };
      await bleu['handlePredict'](mockReq as any, mockRes as any);
      expect(mockSelfLearningCore.predict).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should clean up resources', async () => {
      await bleu.cleanup();
      expect(mockLogger.info).toHaveBeenCalledWith('Cleaning up Bleu');
      expect(mockStorage.cleanup).toHaveBeenCalled();
      expect(mockNLPProcessor.cleanup).toHaveBeenCalled();
      expect(mockSelfLearningCore.cleanup).toHaveBeenCalled();
    });

    it('should handle cleanup errors', async () => {
      jest.spyOn(bleu as any, 'cleanupResources').mockRejectedValue(new Error('Cleanup failed'));
      await expect(bleu.cleanup()).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
}); 