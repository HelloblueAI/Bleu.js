import dotenv from 'dotenv';
import mongoose from 'mongoose';

import AiQuery from '../backend/models/AiQuery'; // Ensure the file path and extension are correct.
import logger from '../backend/utils/logger.js'; // Ensure the logger module is properly configured.

// Load environment variables from .env file
dotenv.config();

async function testMongoOperations(): Promise<void> {
  const uri = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/bleujs';

  try {
    // Connect to MongoDB with updated options
    await mongoose.connect(uri);
    logger.info('Connected to MongoDB successfully.');

    // Insert a sample document
    const query = new AiQuery({
      query: 'What is AI?',
      response: 'Artificial Intelligence explanation.',
      modelUsed: 'GPT-4',
      confidence: 0.97,
    });

    await query.save();
    logger.info('Sample document inserted successfully.');

    // Fetch all documents
    const docs = await AiQuery.find({});
    logger.info('Retrieved documents:', JSON.stringify(docs, null, 2));
  } catch (error) {
    // Handle the error type properly
    logger.error(
      'Error during MongoDB operations:',
      error instanceof Error ? error.message : error,
    );
  } finally {
    // Always disconnect from MongoDB
    await mongoose.disconnect();
    logger.info('MongoDB connection closed.');
  }
}

// Execute the test function
testMongoOperations().catch((error) => {
  logger.error(
    'Unhandled error in testMongoOperations:',
    error instanceof Error ? error.message : error,
  );
});
