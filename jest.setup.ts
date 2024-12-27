import '@testing-library/jest-dom'; // Extend Jest matchers for DOM assertions
import { afterAll, beforeAll, afterEach } from '@jest/globals';
import * as dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

// Extend the global object to include mongoClient
declare global {
  var mongoClient: MongoClient | undefined;
}
global.mongoClient = global.mongoClient || undefined;

// Load environment variables from the `.env` file
dotenv.config({ path: './src/backend/.env' });

// MongoDB connection details
const MONGODB_URI =
  process.env.MONGODB_URI ||
  `mongodb://admin:Pezhman65%21%40%23@localhost:27017/admin`;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined');
}

let mongoClient: MongoClient;

// Jest global setup: Initialize MongoDB connection
beforeAll(async () => {
  try {
    console.log('[Jest Setup] Connecting to MongoDB...');
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    global.mongoClient = mongoClient;
    console.log('[Jest Setup] MongoDB connection established.');
  } catch (error) {
    console.error('[Jest Setup] Failed to connect to MongoDB:', error);
    process.exit(1); // Exit the test process if MongoDB connection fails
  }
});

// Jest global teardown: Close MongoDB connection after tests
afterAll(async () => {
  try {
    if (global.mongoClient) {
      await global.mongoClient.close();
      console.log('[Jest Teardown] MongoDB connection closed.');
    }
  } catch (error) {
    console.error('[Jest Teardown] Error during MongoDB disconnection:', error);
  } finally {
    global.mongoClient = undefined;
  }
});

// Jest cleanup after each test
afterEach(() => {
  if (global.jest) {
    // Reset mocks and modules to avoid side effects
    jest.restoreAllMocks();
    jest.resetModules();
    jest.clearAllMocks();
    jest.clearAllTimers();
  }
});

// Export MongoDB URI for test files
export { MONGODB_URI };
