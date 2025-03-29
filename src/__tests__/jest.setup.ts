import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { MockLogger } from '../utils/logger';
import { Storage } from '../storage/storage';
import { SecurityManager } from '../security/securityManager';
import { QuantumProcessor } from '../quantum/quantumProcessor';
import { ImageProcessor } from '../ai/multimodal/imageProcessor';
import { AudioProcessor } from '../ai/multimodal/audioProcessor';
import { VideoProcessor } from '../ai/multimodal/videoProcessor';
import { NLPProcessor } from '../ai/nlpProcessor';
import { ModelMonitor } from '../monitoring/modelMonitor';
import { BleuAI } from '../ai/bleuAI';
import { StorageConfig } from '../storage/types';
import { SecurityConfig } from '../security/types';
import { MultimodalProcessor } from '../ai/multimodal/processor';
import { BleuConfig } from '../types/config';

// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/bleu_test';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test';
process.env.AWS_SECRET_ACCESS_KEY = 'test';
process.env.TEST_TIMEOUT = '30000';
process.env.MAX_WORKERS = '4';
process.env.LOG_LEVEL = 'error';
process.env.TF_CPP_MIN_LOG_LEVEL = '2';
process.env.JWT_SECRET = 'test-secret';
process.env.API_KEY = 'test-api-key';

// Create a mock logger
const logger = new MockLogger();

// Create storage config
const storageConfig: StorageConfig = {
  path: './test-storage',
  retentionDays: 7,
  compression: false
};

// Create security config
const securityConfig: SecurityConfig = {
  encryption: {
    algorithm: 'aes-256-gcm',
    keySize: 256,
    quantumResistant: true
  },
  authentication: {
    type: 'jwt',
    jwtSecret: process.env.JWT_SECRET || 'test-secret',
    tokenExpiration: 3600
  },
  authorization: {
    roles: ['admin', 'user'],
    permissions: {
      admin: ['read', 'write', 'delete'],
      user: ['read']
    }
  },
  audit: {
    enabled: true,
    logLevel: 'info',
    retention: 30
  },
  rateLimits: {
    maxRequests: 100,
    windowMs: 60000
  },
  jwtSecret: process.env.JWT_SECRET || 'test-secret',
  apiKeys: ['test-api-key'],
  allowedOrigins: ['http://localhost:3000']
};

// Create BleuAI configuration
const bleuConfig: BleuConfig = {
  model: {
    path: './test-models',
    version: '1.0.0',
    maxFeatures: 8,
    quantum: {
      numQubits: 8,
      learningRate: 0.01,
      optimizationLevel: 1,
      useQuantumMemory: true,
      useQuantumAttention: true
    }
  },
  storage: {
    path: './test-storage'
  },
  security: securityConfig
};

// Initialize storage
const storage = new Storage(storageConfig, logger);

// Initialize security manager
const securityManager = new SecurityManager(securityConfig, logger);

// Initialize processors
let nlpProcessor: NLPProcessor;
let imageProcessor: ImageProcessor;
let audioProcessor: AudioProcessor;
let videoProcessor: VideoProcessor;
let multimodalProcessor: MultimodalProcessor;
let quantumProcessor: QuantumProcessor;

beforeAll(async () => {
  // Initialize NLP processor
  nlpProcessor = new NLPProcessor(logger);
  await nlpProcessor.initialize({
    language: 'en',
    maxTokens: 1024,
    model: 'gpt-3.5-turbo'
  });

  // Initialize image processor
  imageProcessor = new ImageProcessor({
    modelPath: './test-models/image',
    maxSize: 1024,
    allowedFormats: ['jpg', 'jpeg', 'png']
  }, storage);

  // Initialize audio processor
  audioProcessor = new AudioProcessor({
    modelPath: './test-models/audio',
    sampleRate: 16000,
    maxDuration: 30,
    allowedFormats: ['wav', 'mp3']
  }, storage);

  // Initialize video processor
  videoProcessor = new VideoProcessor({
    modelPath: './test-models/video',
    maxDuration: 60,
    maxResolution: 720,
    allowedFormats: ['mp4', 'avi'],
    imageProcessorConfig: {
      modelPath: './test-models/image',
      maxSize: 1024,
      allowedFormats: ['jpg', 'jpeg', 'png']
    }
  }, imageProcessor);

  // Create actual quantum processor instance
  quantumProcessor = new QuantumProcessor();

  // Create actual multimodal processor instance
  multimodalProcessor = new MultimodalProcessor({
    modelPath: './test-models/multimodal',
    imageConfig: {
      maxSize: 1024,
      allowedFormats: ['jpg', 'jpeg', 'png']
    },
    audioConfig: {
      sampleRate: 16000,
      maxDuration: 30,
      allowedFormats: ['wav', 'mp3']
    },
    videoConfig: {
      maxDuration: 60,
      maxResolution: 720,
      allowedFormats: ['mp4', 'avi']
    },
    nlpConfig: {
      maxSequenceLength: 512,
      vocabSize: 50000
    }
  }, imageProcessor, audioProcessor, videoProcessor, nlpProcessor);
});

// Create actual model monitor instance
const modelMonitor = new ModelMonitor(storage, {
  storage: {
    path: './test-storage',
    retentionDays: 30
  },
  thresholds: {
    warning: {
      cpu: 80,
      memory: 80,
      latency: 1000
    },
    error: {
      cpu: 90,
      memory: 90,
      latency: 2000
    }
  },
  retentionPeriod: 30 * 24 * 60 * 60 * 1000 // 30 days
});

// Create actual BleuAI instance
const bleuAI = new BleuAI(bleuConfig);

// Add custom matcher for MongoDB ObjectId
expect.extend({
  toBeValidObjectId(received) {
    const isValid = mongoose.Types.ObjectId.isValid(received);
    return {
      message: () => `expected ${received} to be a valid MongoDB ObjectId`,
      pass: isValid,
    };
  },
});

// Global setup
beforeAll(async () => {
  // Initialize all components
  await Promise.all([
    storage.initialize(),
    securityManager.initialize(),
    quantumProcessor.initialize(),
    multimodalProcessor.initialize(),
    modelMonitor.initialize(),
    bleuAI.initialize()
  ]);
});

// Global teardown
afterAll(async () => {
  // Clean up all components
  await Promise.all([
    storage.cleanup(),
    securityManager.cleanup(),
    quantumProcessor.cleanup(),
    multimodalProcessor.cleanup(),
    modelMonitor.cleanup(),
    bleuAI.cleanup()
  ]);
});

// Set up global error handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});

// Clean up after tests
afterAll(async () => {
  await storage.dispose();
  await securityManager.dispose();
});