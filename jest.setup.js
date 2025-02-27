//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.

import { jest } from '@jest/globals';
import crypto from 'crypto';

// Ensure global crypto API is available
global.crypto = global.crypto || crypto;

/**
 * Utility function for creating named Jest mocks.
 * This improves debugging and ensures better stack traces.
 */
const createMock = (name) => {
  const mockFn = jest.fn();
  mockFn.mockName(name);
  return mockFn;
};

/**
 * Global setup before each test to maintain test isolation.
 * Ensures no test pollution and restores original states.
 */
beforeEach(() => {
  jest.resetModules(); // Fully reset module cache
  jest.clearAllMocks(); // Clear mock call history
  jest.restoreAllMocks(); // Restore all original implementations
});

/**
 * Mock logger utility to prevent console pollution during tests.
 * Uses structured named mocks for easier debugging.
 */
jest.mock('./src/utils/logger', () => ({
  info: createMock('logger.info'),
  error: createMock('logger.error'),
  debug: createMock('logger.debug'),
  warn: createMock('logger.warn'),
}));

/**
 * Mock Winston logger to prevent test logs from polluting output.
 * Uses named mocks for structured assertions.
 */
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

/**
 * Mock MongoDB Memory Server to avoid unnecessary in-memory DB instances.
 * This improves test performance by reducing redundant resources.
 */
jest.mock('mongodb-memory-server', () => {
  class MockMongoMemoryServer {
    constructor() {
      this.getUri = jest
        .fn()
        .mockResolvedValue('mongodb://localhost:27017/testdb');
    }

    async start() {
      return Promise.resolve(); // Ensure start is properly awaited
    }

    async stop() {
      return Promise.resolve(); // Ensure stop is properly awaited
    }
  }

  return { MongoMemoryServer: MockMongoMemoryServer };
});

/**
 * Suppresses unnecessary logs during testing.
 * Keeps essential logs while filtering out noisy outputs.
 */
global.console = {
  ...console,
  log: jest.fn((...args) => {
    if (!args.some((arg) => String(arg).includes('MongoDB Memory Server'))) {
      process.stdout.write(`LOG: ${args.join(' ')}\n`); // Optional: Keep essential logs
    }
  }),
  error: jest.fn((...args) => {
    if (!args.some((arg) => String(arg).includes('MongoDB error'))) {
      process.stderr.write(`ERROR: ${args.join(' ')}\n`);
    }
  }),
  warn: jest.fn(),
};

/**
 * Prevents unhandled promise rejections from causing silent failures.
 * Ensures all async errors are explicitly reported.
 */
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  throw new Error(`Unhandled Promise Rejection: ${reason}`);
});

/**
 * Ensures uncaught exceptions do not crash the test suite.
 * Instead of exiting, explicitly fail the test.
 */
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  throw new Error(`Uncaught Exception: ${error.message}`);
});
