import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createLogger } from './src/utils/logger';

interface GlobalWithMongoServer extends NodeJS.Global {
  mongoServer?: MongoMemoryServer;
}

declare const global: GlobalWithMongoServer;

const logger = createLogger('JestTeardowns');

export default async function teardown(): Promise<void> {
  try {
    // Disconnect from MongoDB
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      logger.info('Disconnected from MongoDB');
    }

    // Stop MongoDB Memory Server
    if (global.mongoServer) {
      await global.mongoServer.stop();
      logger.info('Stopped MongoDB Memory Server');
    }

    // Clear any remaining timeouts
    jest.useRealTimers();

    // Clear any remaining mocks
    jest.clearAllMocks();

    // Clear any remaining intervals
    const highestIntervalId = setInterval(() => {}, 0);
    for (let i = 0; i < highestIntervalId; i++) {
      clearInterval(i);
    }

    // Clear any remaining timeouts
    const highestTimeoutId = setTimeout(() => {}, 0);
    for (let i = 0; i < highestTimeoutId; i++) {
      clearTimeout(i);
    }

    logger.info('Jest teardown completed successfully');
  } catch (error) {
    logger.error('Error during Jest teardown:', error);
    throw error;
  }
} 