import { jest } from '@jest/globals';
import path from 'path';
import { promisify } from 'util';
import crypto from 'crypto';

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

// Mock logger
jest.mock('./src/utils/logger', () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.TF_CPP_MIN_LOG_LEVEL = '2';
process.env.AWS_REGION = 'us-east-1';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

// Set test timeout
jest.setTimeout(30000);

// Mock console methods
console.log = jest.fn();
console.error = jest.fn();
console.warn = jest.fn();

// Ensure crypto API is available
global.crypto = crypto;

// Performance monitoring
global.performance = {
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn()
};

// Enhanced console logging
const logLevels = ['log', 'error', 'warn', 'info', 'debug'] as const;
logLevels.forEach(level => {
  console[level] = jest.fn().mockImplementation((...args: unknown[]) => {
    if (process.env.DEBUG) {
      console.info(`[${level.toUpperCase()}]`, ...args);
    }
  });
});

// Test lifecycle hooks
beforeAll(() => {
  jest.useFakeTimers();
});

beforeEach(() => {
  jest.clearAllMocks();
  performance.clearMarks();
  performance.clearMeasures();
});

afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

afterAll(() => {
  jest.useRealTimers();
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