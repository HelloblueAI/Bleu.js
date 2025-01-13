// External imports
import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';
import { Schema, model, connect, disconnect } from 'mongoose';
import winston from 'winston';

// Initialize dotenv for environment variables
dotenv.config();

// Setup logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message }) =>
        `${timestamp} [${level.toUpperCase()}]: ${message}`,
    ),
  ),
  transports: [new winston.transports.Console()],
});

// Check for .env file
function checkEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    logger.error(
      'Missing .env file. Ensure the file exists in the project root.',
    );
    process.exit(1);
  }
  logger.info('.env file found and loaded.');
}

// Validate environment variables
function validateEnv() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    logger.error('MONGODB_URI is not defined in the environment variables.');
    process.exit(1);
  }
  return mongoUri;
}

// Define schema
const ruleSchema = new Schema({
  name: { type: String, required: true },
  conditions: { type: [String], default: [] },
  actions: { type: [String], default: [] },
});

const RuleModel = model('Rule', ruleSchema);

// Perform database operations
async function performDatabaseOperations() {
  const mongoUri = validateEnv();
  try {
    await connect(mongoUri);
    logger.info('Successfully connected to MongoDB.');

    // Create and save a document
    const ruleDoc = new RuleModel({
      name: 'Test Rule',
      conditions: ['condition1', 'condition2'],
      actions: ['approve', 'notify'],
    });
    await ruleDoc.save();
    logger.info('Document saved:', JSON.stringify(ruleDoc));

    // Retrieve and log the saved document
    const retrievedDoc = await RuleModel.findOne({ name: 'Test Rule' });
    logger.info('Document retrieved:', JSON.stringify(retrievedDoc));

    // Update the document
    const updatedDoc = await RuleModel.findOneAndUpdate(
      { name: 'Test Rule' },
      { $set: { actions: ['reject'] } },
      { new: true },
    );
    logger.info('Document updated:', JSON.stringify(updatedDoc));

    // Delete the document
    await RuleModel.deleteOne({ name: 'Test Rule' });
    logger.info('Document deleted successfully.');
  } catch (err) {
    logger.error('Error performing database operations:', err.message);
  } finally {
    await disconnect();
    logger.info('Disconnected from MongoDB.');
  }
}

// Main execution
(async function runTest() {
  logger.info('Starting manual connection test...');
  checkEnvFile();
  await performDatabaseOperations();
  logger.info('Manual connection test completed.');
})();
