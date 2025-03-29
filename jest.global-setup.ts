import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createLogger } from './src/utils/logger';

const logger = createLogger('JestGlobalSetup');

export default async function globalSetup(): Promise<void> {
  try {
    // Create MongoDB Memory Server
    const mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '6.0.4'
      }
    });
    const mongoUri = await mongoServer.getUri();

    // Store the MongoDB server URI in the environment
    process.env.MONGODB_URI = mongoUri;
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB Memory Server');

    // Store the server instance for cleanup
    (global as any).__MONGOSERVER__ = mongoServer;

    // Set up test environment variables
    process.env.NODE_ENV = 'test';
    process.env.TEST_TIMEOUT = '30000';
    process.env.MAX_WORKERS = '4';
    process.env.LOG_LEVEL = 'debug';

    logger.info('Global setup completed successfully');
  } catch (error) {
    logger.error('Error during global setup:', error);
    throw error;
  }
} 