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
const { createLogger } = require('winston');
const semver = require('semver');


jest.setTimeout(30000);


jest.mock('winston', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    silly: jest.fn(),
  };

  return {
    createLogger: jest.fn(() => mockLogger),
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      printf: jest.fn(),
      json: jest.fn(),
      colorize: jest.fn(),
      simple: jest.fn(),
      errors: jest.fn(),
    },
    transports: {
      Console: jest.fn(),
      File: jest.fn(),
      Stream: jest.fn(),
    },
    addColors: jest.fn(),
  };
});


jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(() => true),
}));


jest.mock('child_process', () => ({
  execSync: jest.fn(),
  spawn: jest.fn(),
}));


process.env = {
  ...process.env,
  NODE_ENV: 'test',
  PORT: '3002',
  CORS_ORIGIN: 'http://localhost:4002',
  LOG_LEVEL: 'info',
  API_VERSION: 'v1',
  MAX_REQUEST_SIZE: '10mb',
};


global.waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

global.mockRequest = () => ({
  headers: {},
  query: {},
  params: {},
  body: {},
});

global.mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.header = jest.fn().mockReturnValue(res);
  return res;
};


const isValidVersion = (version) => {



  return semver.valid(version) !== null;
};


const isValidISODate = (dateStr) => {
  const simpleISOFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  if (!simpleISOFormat.test(dateStr)) return false;

  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
};


expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    return {
      message: () =>
        `expected ${received} to be within range ${floor} - ${ceiling}`,
      pass,
    };
  },
  toBeValidSemver(received) {
    const pass = isValidVersion(received);
    return {
      message: () => `expected ${received} to be a valid semver version`,
      pass,
    };
  },
  toBeISODate(received) {
    const pass = isValidISODate(received);
    return {
      message: () => `expected ${received} to be a valid ISO date`,
      pass,
    };
  },
});


beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.clearAllMocks();
});

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

afterAll(() => {
  console.error.mockRestore();
  console.warn.mockRestore();
});


process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection in tests:', error);
});
