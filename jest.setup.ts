import { afterAll, afterEach, beforeAll } from '@jest/globals';
import '@testing-library/jest-dom'; // Extend Jest matchers for DOM assertions
import * as dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

// Extend the global object to include mongoClient
declare global {
  var mongoClient: MongoClient | undefined;
}
global.mongoClient = global.mongoClient || undefined;

// Load environment variables from the `.env` file
dotenv.config({ path: './src/backend/.env' });

// Suppress console logs globally
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation((message) => {
    // Allow only specific logs if needed; otherwise, suppress all
    if (!message.includes('Allowed log message')) {
      return;
    }
  });
  jest.spyOn(console, 'warn').mockImplementation(() => { });
  jest.spyOn(console, 'error').mockImplementation(() => { });
});

afterAll(() => {
  jest.restoreAllMocks(); // Restore all mocked console methods
});

// MongoDB connection details
const MONGODB_URI =
  process.env.MONGODB_URI ||
  `mongodb://admin:Pezhman65%21%40%23@localhost:27017/admin`;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined. Ensure your environment variables are configured correctly.');
}

let mongoClient: MongoClient;

// Jest global setup: Initialize MongoDB connection
beforeAll(async () => {
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    global.mongoClient = mongoClient;
  } catch (error) {
    throw new Error(`Error during Jest MongoDB setup: ${error instanceof Error ? error.message : String(error)}`);

  }
});

// Jest global teardown: Close MongoDB connection after tests
afterAll(async () => {
  try {
    if (global.mongoClient) {
      await global.mongoClient.close();

    }
  } catch (error) {
    throw new Error(`Error during Jest MongoDB teardown: ${error instanceof Error ? error.message : String(error)}`);

  } finally {
    global.mongoClient = undefined;
  }
});

// Jest cleanup after each test
afterEach(() => {
  jest.restoreAllMocks();
  jest.resetModules();
  jest.clearAllMocks();
  jest.clearAllTimers();
});

// Export MongoDB URI for use in test files
export { MONGODB_URI };
