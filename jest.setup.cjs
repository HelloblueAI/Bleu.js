const { jest } = require('@jest/globals');
const path = require('path');
const { promisify } = require('util');
const crypto = require('crypto');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.TF_CPP_MIN_LOG_LEVEL = '2';

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
const logLevels = ['log', 'error', 'warn', 'info', 'debug'];
logLevels.forEach(level => {
  console[level] = jest.fn().mockImplementation((...args) => {
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
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Set dirname for compatibility
global.__dirname = process.cwd(); 