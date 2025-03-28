import 'reflect-metadata';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.test' });

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  jest.resetAllMocks();
}); 