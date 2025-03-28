import { performance } from 'perf_hooks';
import crypto from 'crypto';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

// Set up global performance API
global.performance = performance;

// Set up global crypto API
global.crypto = crypto;

// Set up environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.AWS_REGION = 'us-east-1';
process.env.TEST_TIMEOUT = '10000';
process.env.MAX_WORKERS = '50%';
process.env.LOG_LEVEL = 'error';

// Set up console methods with structured logging
const originalConsole = { ...console };
console.log = (...args) => {
  const timestamp = new Date().toISOString();
  originalConsole.log(`[${timestamp}]`, ...args);
};

console.error = (...args) => {
  const timestamp = new Date().toISOString();
  originalConsole.error(`[${timestamp}] ERROR:`, ...args);
};

console.warn = (...args) => {
  const timestamp = new Date().toISOString();
  originalConsole.warn(`[${timestamp}] WARN:`, ...args);
};

console.info = (...args) => {
  const timestamp = new Date().toISOString();
  originalConsole.info(`[${timestamp}] INFO:`, ...args);
};

console.debug = (...args) => {
  const timestamp = new Date().toISOString();
  originalConsole.debug(`[${timestamp}] DEBUG:`, ...args);
};

// Set up test lifecycle hooks
beforeAll(async () => {
  // Initialize test environment
  process.env.TEST_START_TIME = Date.now().toString();
});

afterAll(async () => {
  // Clean up test environment
  const startTime = parseInt(process.env.TEST_START_TIME || '0', 10);
  const duration = Date.now() - startTime;
  console.info(`Test suite completed in ${duration}ms`);
});

// Set up performance monitoring
const performanceMarks = new Map();
const performanceMeasures = new Map();

global.performance.mark = (name) => {
  performanceMarks.set(name, performance.now());
};

global.performance.measure = (name, startMark, endMark) => {
  const start = performanceMarks.get(startMark);
  const end = performanceMarks.get(endMark);
  if (start && end) {
    performanceMeasures.set(name, end - start);
  }
};

global.performance.getEntriesByName = (name) => {
  return Array.from(performanceMeasures.entries())
    .filter(([key]) => key === name)
    .map(([_, value]) => ({ name, duration: value }));
};

global.performance.clearMarks = () => {
  performanceMarks.clear();
};

global.performance.clearMeasures = () => {
  performanceMeasures.clear();
};

// Set up error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Set up test timeout
jest.setTimeout(10000);

// Set up test environment
global.testEnvironment = {
  setup: async () => {
    // Initialize test environment
    console.info('Setting up test environment');
  },
  teardown: async () => {
    // Clean up test environment
    console.info('Tearing down test environment');
  },
};

// Set up test utilities
global.testUtils = {
  sleep: promisify(setTimeout),
  randomString: (length = 10) => {
    return crypto.randomBytes(length).toString('hex');
  },
  randomNumber: (min = 0, max = 100) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
};

// Set up test mocks
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    ...jest.requireActual('fs').promises,
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
  },
}));

jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn((...args) => args.join('/')),
  dirname: jest.fn((path) => path.split('/').slice(0, -1).join('/')),
}));

// Set up test helpers
global.helpers = {
  async waitForCondition(condition, timeout = 5000, interval = 100) {
    const start = Date.now();
    while (!condition()) {
      if (Date.now() - start > timeout) {
        throw new Error('Condition not met within timeout');
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  },
  async retry(fn, retries = 3, delay = 1000) {
    let lastError;
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  },
}; 