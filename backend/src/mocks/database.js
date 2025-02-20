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

'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger').default;

const MONGODB_URI = process.env.MONGODB_URI || 'your-mongodb-uri';

const connect = async () => {
  if (!MONGODB_URI) {
    logger.error('❌ MongoDB URI is not set in environment variables.');
    throw new Error('MONGODB_URI is required for database connection.');
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout for initial connection
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      autoIndex: false, // Disable auto-creation of indexes in production
      maxPoolSize: 10, // Connection pool limit
    });

    logger.info('✅ Successfully connected to MongoDB.');

    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      logger.error(`🚨 MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });
  } catch (error) {
    logger.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1); // Exit process if DB connection fails
  }
};

const disconnect = async () => {
  try {
    await mongoose.disconnect();
    logger.info('🔌 Successfully disconnected from MongoDB.');
  } catch (error) {
    logger.error(`❌ MongoDB disconnection error: ${error.message}`);
  }
};

module.exports = { connect, disconnect };
