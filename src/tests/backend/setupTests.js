/* eslint-env jest */
import { TextEncoder, TextDecoder } from 'util';

import { MongoClient } from 'mongodb';
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/bleujs';
process.env.PORT = '3000';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.CORE_ENGINE_URL = 'http://localhost:4000';

// Polyfill TextEncoder and TextDecoder (Node.ts < v16)
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

let client;
let db;

// Helper to clear all collections
const clearDatabase = async () => {
  if (db) {
    const collections = await db.collections();
    await Promise.all(
      collections.map((collection) => collection.deleteMany({})),
    );
    console.log('🧹 All test collections cleared.');
  }
};

beforeAll(async () => {
  console.log('🔍 Setting up tests: Connecting to MongoDB...');
  console.log(`🔗 MongoDB URI: ${process.env.MONGODB_URI}`);

  try {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db();
    console.log('✅ MongoDB connected.');
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
});

afterEach(async () => {
  console.log('🧼 Cleaning up after test...');
  await clearDatabase();

  jest.clearAllMocks();
  jest.resetModules();
  jest.restoreAllMocks();
  jest.clearAllTimers();
});

afterAll(async () => {
  console.log('🔌 Tearing down tests: Closing MongoDB connection...');
  if (client) {
    await client.close();
    console.log('✅ MongoDB connection closed.');
  }
});
