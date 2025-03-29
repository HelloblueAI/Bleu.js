import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createLogger } from '../utils/logger';

dotenv.config();

const logger = createLogger('MongoDBTest');
const MONGO_URI = process.env.MONGO_URI;

async function testConnection(): Promise<void> {
  try {
    logger.info('Attempting to connect to MongoDB...');
    
    if (!MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not set');
    }

    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });

    logger.info('Successfully connected to MongoDB!');
    await mongoose.connection.close();
  } catch (error) {
    logger.error('Connection failed:', error);
    throw error;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testConnection()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('Test failed:', error);
      process.exit(1);
    });
}

export { testConnection }; 