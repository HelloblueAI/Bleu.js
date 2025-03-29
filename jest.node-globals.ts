import { performance } from 'perf_hooks';
import crypto from 'crypto';
import { TextEncoder, TextDecoder } from 'util';

declare global {
  namespace NodeJS {
    interface Global {
      performance: typeof performance;
      crypto: typeof crypto;
      TextEncoder: typeof TextEncoder;
      TextDecoder: typeof TextDecoder;
      __MONGOSERVER__?: any;
      testUtils: {
        createMockLogger: () => {
          info: jest.Mock;
          error: jest.Mock;
          debug: jest.Mock;
          warn: jest.Mock;
        };
        createMockStorage: () => {
          save: jest.Mock;
          get: jest.Mock;
          delete: jest.Mock;
        };
        createMockMonitor: () => {
          start: jest.Mock;
          stop: jest.Mock;
          getMetrics: jest.Mock;
        };
      };
    }
  }
}

// Set up global performance API
global.performance = performance;

// Set up global crypto API
global.crypto = crypto;

// Set up TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Set up test utilities
global.testUtils = {
  createMockLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }),
  createMockStorage: () => ({
    save: jest.fn(),
    get: jest.fn(),
    delete: jest.fn()
  }),
  createMockMonitor: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    getMetrics: jest.fn()
  })
}; 