import { config } from 'dotenv';
import { resolve } from 'path';

// Load test environment variables
config({ path: resolve(__dirname, '../../.env.test') });

// Set default test environment variables
process.env.NODE_ENV = 'test';
process.env.TEST_MODE = 'true';
process.env.JWT_SECRET = 'test-secret';
process.env.PORT = '3000';

// Mock environment variables that might be used in tests
process.env.API_KEY = 'test-api-key';
process.env.API_SECRET = 'test-api-secret';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

// Set up test-specific timeouts
jest.setTimeout(30000);

// Mock console methods to reduce noise during tests
const originalConsole = { ...console };
console.log = jest.fn();
console.error = jest.fn();
console.warn = jest.fn();
console.debug = jest.fn();
console.info = jest.fn();

// Restore console methods after tests
afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.debug = originalConsole.debug;
  console.info = originalConsole.info;
}); 