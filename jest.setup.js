import { jest } from '@jest/globals';

// Ensure `crypto` module is available
import crypto from 'crypto';
global.crypto = global.crypto || crypto;

const createMock = (name) => {
  const mock = jest.fn();
  mock.mockName(name);
  return mock;
};

global.beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

// Mock Logger Utility
jest.mock('./src/utils/logger', () => ({
  info: createMock('logger.info'),
  error: createMock('logger.error'),
  debug: createMock('logger.debug'),
  warn: createMock('logger.warn'),
}));

// Mock Winston Logger
jest.mock('winston', () => {
  const actualWinston = jest.requireActual('winston');
  return {
    ...actualWinston,
    createLogger: jest.fn(() => ({
      info: createMock('winston.info'),
      error: createMock('winston.error'),
      warn: createMock('winston.warn'),
      debug: createMock('winston.debug'),
    })),
    format: {
      combine: jest.fn(() => 'mockedCombine'),
      timestamp: jest.fn(() => 'mockedTimestamp'),
      printf: jest.fn(() => 'mockedPrintf'),
    },
    transports: {
      Console: jest.fn(() => ({
        log: createMock('winston.Console.log'),
      })),
    },
  };
});

// Mock MongoMemoryServer
jest.mock('mongodb-memory-server', () => {
  return {
    MongoMemoryServer: class {
      constructor() {
        this.getUri = jest.fn().mockResolvedValue('mongodb://localhost:27017/testdb');
      }
      start() {
        return jest.fn();
      }
      stop() {
        return jest.fn();
      }
    },
  };
});

// Handle Global Errors
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
