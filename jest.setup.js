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


jest.mock('./src/utils/logger', () => ({
  info: createMock('logger.info'),
  error: createMock('logger.error'),
  debug: createMock('logger.debug'),
  warn: createMock('logger.warn'),
}));


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


process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
