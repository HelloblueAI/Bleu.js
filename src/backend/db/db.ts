import { MongoClient, Db } from 'mongodb';

import logger from './utils/logger.js'; // Ensure the path to logger.js is correct.

const uri = process.env['MONGO_URI'] || 'mongodb://127.0.0.1:27017';
const client = new MongoClient(uri);

let db: Db | null = null;

async function connectDB(): Promise<void> {
  try {
    await client.connect();
    logger.info('Database connected successfully.');
    db = client.db('your-database-name'); // Replace with your actual DB name.
  } catch (error) {
    logger.error('Database connection failed', error);
    throw error;
  }
}

function getDB(): Db {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return db;
}

async function disconnectDB(): Promise<void> {
  try {
    await client.close();
    logger.info('Database disconnected successfully.');
  } catch (error) {
    logger.error('Database disconnection failed', error);
    throw error;
  }
}

export { connectDB, getDB, disconnectDB };
