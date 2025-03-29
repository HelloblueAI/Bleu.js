import { jest } from '@jest/globals';
import crypto from 'crypto';
import { performance } from 'perf_hooks';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createMockLogger } from './src/utils/logger';

// Mock TensorFlow.js
jest.mock('@tensorflow/tfjs-node', () => ({
  setBackend: jest.fn(),
  getBackend: jest.fn(),
  sequential: jest.fn().mockReturnValue({
    add: jest.fn().mockReturnThis(),
    compile: jest.fn().mockReturnThis(),
    fit: jest.fn().mockResolvedValue({ history: {} }),
    predict: jest.fn().mockResolvedValue({
      array: jest.fn().mockResolvedValue([0.5]),
      dispose: jest.fn()
    }),
    evaluate: jest.fn().mockResolvedValue([0.5, 0.8]),
    dispose: jest.fn()
  }),
  layers: {
    dense: jest.fn().mockReturnValue({}),
    dropout: jest.fn().mockReturnValue({})
  },
  train: {
    adam: jest.fn().mockReturnValue({})
  },
  tensor2d: jest.fn().mockReturnValue({
    dispose: jest.fn()
  }),
  tensor1d: jest.fn().mockReturnValue({
    dispose: jest.fn()
  })
}));

// Mock logger implementation
const mockLoggerFactory = () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  performance: jest.fn()
});

// Mock logger
jest.mock('./src/utils/logger', () => ({
  createLogger: jest.fn().mockReturnValue(mockLoggerFactory()),
  createMockLogger: mockLoggerFactory,
  defaultLogger: mockLoggerFactory()
}));

// Mock Storage
jest.mock('./src/utils/storage', () => {
  return {
    Storage: jest.fn().mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      dispose: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue({}),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined)
    }))
  };
});

// Mock BleuAI
jest.mock('./src/ai/bleuAI', () => {
  return {
    BleuAI: jest.fn().mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      dispose: jest.fn().mockResolvedValue(undefined),
      process: jest.fn().mockResolvedValue({
        sentiment: 0.5,
        entities: [],
        topics: [],
        summary: 'Test summary'
      }),
      train: jest.fn().mockResolvedValue(undefined),
      evaluate: jest.fn().mockResolvedValue({
        accuracy: 0.85,
        precision: 0.8,
        recall: 0.75,
        f1Score: 0.77
      })
    }))
  };
});

// Mock NLPProcessor
jest.mock('./src/nlp/nlpProcessor', () => {
  return {
    NLPProcessor: jest.fn().mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      dispose: jest.fn().mockResolvedValue(undefined),
      process: jest.fn().mockResolvedValue({
        tokens: ['test'],
        entities: [],
        sentiment: 0.5
      }),
      train: jest.fn().mockResolvedValue(undefined)
    }))
  };
});

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.TF_CPP_MIN_LOG_LEVEL = '2';
process.env.AWS_REGION = 'us-east-1';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.TEST_TIMEOUT = '30000';
process.env.MAX_WORKERS = '4';
process.env.LOG_LEVEL = 'debug';

// Set test timeout
jest.setTimeout(30000);

// Mock console methods
const originalConsole = { ...console };
console.log = jest.fn();
console.error = jest.fn();
console.warn = jest.fn();
console.info = jest.fn();
console.debug = jest.fn();

// Ensure crypto API is available
global.crypto = crypto;

// Performance monitoring
global.performance = performance;

// Enhanced console logging
const logLevels = ['log', 'error', 'warn', 'info', 'debug'] as const;
logLevels.forEach(level => {
  console[level] = jest.fn().mockImplementation((...args: unknown[]) => {
    if (process.env.DEBUG) {
      console.info(`[${level.toUpperCase()}]`, ...args);
    }
  });
});

// Mock fs module
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    unlink: jest.fn(),
    rmdir: jest.fn()
  }
}));

// Mock path module
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn(),
  resolve: jest.fn(),
  dirname: jest.fn(),
  basename: jest.fn(),
  extname: jest.fn()
}));

// Mock process
jest.mock('process', () => ({
  ...jest.requireActual('process'),
  env: {
    NODE_ENV: 'test',
    MONGODB_URI: 'mongodb://localhost:27017/test',
    AWS_REGION: 'us-east-1',
    TEST_TIMEOUT: '30000',
    MAX_WORKERS: '4',
    LOG_LEVEL: 'debug'
  }
}));

// Set up test utilities
const testUtils = {
  mockTensor: {
    dispose: jest.fn(),
    dataSync: jest.fn(),
    predict: jest.fn(),
    trainOnBatch: jest.fn(),
    evaluate: jest.fn(),
    save: jest.fn(),
    load: jest.fn()
  },
  mockModel: {
    compile: jest.fn(),
    fit: jest.fn(),
    evaluate: jest.fn(),
    predict: jest.fn(),
    save: jest.fn(),
    load: jest.fn()
  },
  mockDataset: {
    batch: jest.fn(),
    shuffle: jest.fn(),
    prefetch: jest.fn(),
    map: jest.fn(),
    filter: jest.fn()
  }
};

// Add test utilities to global
declare global {
  namespace NodeJS {
    interface Global {
      testUtils: typeof testUtils;
    }
  }
}

global.testUtils = testUtils;

// Test lifecycle hooks
beforeAll(async () => {
  // Initialize test environment
  console.log('Setting up test environment...');
  jest.useFakeTimers();

  // Create an in-memory MongoDB instance
  const mongoServer = await MongoMemoryServer.create({
    binary: {
      version: '6.0.4'
    }
  });
  const mongoUri = await mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri);
  
  // Store the mongoServer instance globally for cleanup
  (global as any).mongoServer = mongoServer;
});

beforeEach(() => {
  jest.clearAllMocks();
  performance.clearMarks();
  performance.clearMeasures();
});

afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  // Restore original console methods
  Object.assign(console, originalConsole);
});

afterAll(async () => {
  // Clean up test environment
  console.log('Cleaning up test environment...');
  jest.useRealTimers();

  // Disconnect from the database
  await mongoose.disconnect();
  
  // Stop the in-memory MongoDB instance
  if ((global as any).mongoServer) {
    await (global as any).mongoServer.stop();
  }
});

// Error handling
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
});

// Set dirname for compatibility
global.__dirname = process.cwd();

// Reset database and mocks before each test
beforeEach(async () => {
  // Clear the database
  await mongoose.connection.dropDatabase();
  
  // Clear all mocks
  jest.clearAllMocks();
});

// Extend Jest matchers
expect.extend({
  toBeValidMongoId(received: string) {
    const isValid = mongoose.Types.ObjectId.isValid(received);
    return {
      message: () => `expected ${received} to be a valid MongoDB ObjectId`,
      pass: isValid
    };
  }
});

// Add custom type definitions
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidMongoId(): R;
    }
  }
} 