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
process.env.TEST_TIMEOUT = '30000';
process.env.MAX_WORKERS = '4';
process.env.LOG_LEVEL = 'debug';

// Mock console methods
const originalConsole = { ...console };
console.log = jest.fn();
console.error = jest.fn();
console.warn = jest.fn();
console.info = jest.fn();
console.debug = jest.fn();

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

// Mock TensorFlow.js
jest.mock('@tensorflow/tfjs-node', () => ({
  sequential: jest.fn(),
  layers: {
    dense: jest.fn(),
    dropout: jest.fn(),
    conv2d: jest.fn(),
    maxPooling2d: jest.fn(),
    flatten: jest.fn()
  },
  train: {
    adam: jest.fn(),
    sgd: jest.fn(),
    rmsprop: jest.fn()
  },
  metrics: {
    binaryAccuracy: jest.fn(),
    categoricalAccuracy: jest.fn(),
    meanSquaredError: jest.fn()
  },
  io: {
    withSaveHandler: jest.fn(),
    withLoadHandler: jest.fn()
  }
}));

// Mock HuggingFace
jest.mock('@huggingface/inference', () => ({
  HfInference: jest.fn().mockImplementation(() => ({
    textGeneration: jest.fn(),
    textClassification: jest.fn(),
    translation: jest.fn(),
    summarization: jest.fn(),
    questionAnswering: jest.fn(),
    zeroShotClassification: jest.fn(),
    tokenClassification: jest.fn(),
    languageIdentification: jest.fn(),
    sentenceSimilarity: jest.fn()
  }))
}));

// Mock logger
jest.mock('../utils/logger', () => ({
  createLogger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn()
  }))
}));

// Mock crypto
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn(),
  createHash: jest.fn(),
  createHmac: jest.fn(),
  createCipheriv: jest.fn(),
  createDecipheriv: jest.fn()
}));

// Mock performance
jest.mock('perf_hooks', () => ({
  performance: {
    now: jest.fn(),
    mark: jest.fn(),
    measure: jest.fn(),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn()
  }
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

// Mock util
jest.mock('util', () => ({
  ...jest.requireActual('util'),
  promisify: jest.fn(),
  inherits: jest.fn(),
  deprecate: jest.fn()
}));

// Mock fs promises
const fsPromises = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  readdir: jest.fn(),
  stat: jest.fn(),
  unlink: jest.fn(),
  rmdir: jest.fn()
};

// Mock path functions
const pathMocks = {
  join: jest.fn(),
  resolve: jest.fn(),
  dirname: jest.fn(),
  basename: jest.fn(),
  extname: jest.fn()
};

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

// Set up test lifecycle hooks
beforeAll(async () => {
  // Initialize test environment
  console.log('Setting up test environment...');
});

afterAll(async () => {
  // Clean up test environment
  console.log('Cleaning up test environment...');
});

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Reset console methods
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
  console.debug = jest.fn();
});

afterEach(() => {
  // Clean up after each test
  jest.resetAllMocks();
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in test environment
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process in test environment
}); 