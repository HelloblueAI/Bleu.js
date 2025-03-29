import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import { createLogger } from '../utils/logger';
import { MongoMemoryServer } from 'mongodb-memory-server';

const logger = createLogger('TestSetup');
let mongoServer: MongoMemoryServer;

// Set global timeout for all tests
jest.setTimeout(30000);

// Store original console methods
const originalConsole = { ...console };

// Global test setup
beforeAll(async () => {
  try {
    // Set test environment
    process.env['NODE_ENV'] = 'test';
    process.env['TEST_MODE'] = 'true';
    
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(uri, {
      autoIndex: true,
    });
    logger.info('Connected to in-memory MongoDB');

    // Mock console methods to reduce noise during tests
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    console.debug = jest.fn();
    console.info = jest.fn();

    // Set up global mocks
    global.console = {
      ...console,
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    };

    // Set up test environment variables
    process.env['JWT_SECRET'] = 'test-secret';
    process.env['MONGODB_URI'] = uri;
    process.env['REDIS_URL'] = 'redis://localhost:6379';
    process.env['API_KEY'] = 'test-api-key';
    process.env['API_SECRET'] = 'test-api-secret';
    process.env['AWS_API_URL'] = 'https://mozxitsnsh.execute-api.us-west-2.amazonaws.com/prod';
    process.env['AWS_REGION'] = 'us-west-2';

    // Set up global test constants
    global.__TEST_CONFIG__ = {
      apiUrl: process.env['AWS_API_URL'],
      timeout: 5000,
      retryAttempts: 3,
      retryDelay: 1000,
    };

    // Set up global fetch mock for API tests
    global.fetch = jest.fn();
    
    // Set up default headers for API requests
    global.__TEST_HEADERS__ = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env['JWT_SECRET']}`,
      'x-api-key': process.env['API_KEY'],
    };

  } catch (error) {
    logger.error('Error in test setup:', error);
    throw error;
  }
});

// Global test teardown
afterAll(async () => {
  try {
    // Clean up and close the database connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      logger.info('Disconnected from MongoDB');
    }
    
    // Stop the in-memory MongoDB server
    if (mongoServer) {
      await mongoServer.stop();
      logger.info('Stopped in-memory MongoDB server');
    }

    // Restore original console methods
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;

    // Clear all mocks
    jest.clearAllMocks();
    
    // Clear all timers
    jest.useRealTimers();
  } catch (error) {
    logger.error('Error in test teardown:', error);
    throw error;
  }
});

// Add custom matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  toBeValidJWT(received: string) {
    try {
      const [header, payload, signature] = received.split('.');
      return {
        message: () => `expected ${received} to be a valid JWT`,
        pass: Boolean(header && payload && signature),
      };
    } catch {
      return {
        message: () => `expected ${received} to be a valid JWT`,
        pass: false,
      };
    }
  },
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return {
      message: () => `expected ${received} to be a valid UUID`,
      pass: uuidRegex.test(received),
    };
  },
  toBeValidAPIResponse(received: any) {
    const hasRequiredFields = received 
      && typeof received === 'object'
      && 'status' in received
      && 'data' in received;
    return {
      message: () => `expected ${JSON.stringify(received)} to be a valid API response`,
      pass: hasRequiredFields,
    };
  }
}); 