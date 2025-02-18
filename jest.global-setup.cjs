const fs = require('fs');
const util = require('util');
const path = require('path');

module.exports = async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JEST_WORKER_ID = process.env.JEST_WORKER_ID || '1';

  // Set up global encoders
  global.TextEncoder = util.TextEncoder;
  global.TextDecoder = util.TextDecoder;

  // Create test directories if needed
  const testDirs = ['coverage', 'reports'];
  testDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });

  // Set up environment for MongoDB if needed
  if (process.env.MONGODB_URI) {
    try {
      const mongoose = require('mongoose');
      await mongoose.connect(process.env.MONGODB_URI);
    } catch (error) {
      console.error('MongoDB connection failed:', error);
    }
  }
};
