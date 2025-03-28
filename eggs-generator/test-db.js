//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/eggs-db';

// Replace hard-coded credentials with environment variables
const DB_USER = process.env.TEST_DB_USER || 'test_user';
const DB_PASSWORD = process.env.TEST_DB_PASSWORD || 'test_password';
const DB_HOST = process.env.TEST_DB_HOST || 'localhost';
const DB_PORT = process.env.TEST_DB_PORT || '27017';
const DB_NAME = process.env.TEST_DB_NAME || 'test_db';

// Use environment variables for connection
const connectionString = `mongodb://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

const connectMongoDB = async () => {
  try {
    // Check if credentials are available
    if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
      logger.warn(
        '⚠️ Database credentials not provided in environment variables',
      );
      // For testing environments, you might want to continue with anonymous connection
      // For production, you might want to fail fast
    }

    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      authSource: 'admin',
      user: process.env.DB_USER,
      pass: process.env.DB_PASSWORD,
    });

    logger.info('✅ MongoDB connection successful');

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected. Reconnecting...');
      connectMongoDB();
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`❌ MongoDB connection error: ${err.message}`);
    });
  } catch (err) {
    logger.error(`❌ MongoDB initial connection error: ${err.message}`);
    process.exit(1);
  }
};

export default connectMongoDB;
