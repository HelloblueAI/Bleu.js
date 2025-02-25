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

const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');

module.exports = async () => {
  console.log('🛠️ Jest Global Setup Initializing...');

  // Set Environment Variables
  process.env.NODE_ENV = 'test';
  process.env.JEST_WORKER_ID = process.env.JEST_WORKER_ID || '1';

  // Ensure global utilities exist
  if (!global.TextEncoder) global.TextEncoder = require('util').TextEncoder;
  if (!global.TextDecoder) global.TextDecoder = require('util').TextDecoder;

  // Define and create necessary test directories
  const testDirs = ['coverage', 'reports'];
  try {
    await Promise.all(
      testDirs.map(async (dir) => {
        const dirPath = path.join(process.cwd(), dir);
        try {
          await fs.access(dirPath);
        } catch {
          await fs.mkdir(dirPath, { recursive: true });
          console.log(`📂 Created test directory: ${dirPath}`);
        }
      })
    );
  } catch (err) {
    console.error('❌ Failed to create test directories:', err);
  }

  // Mute console.logs from MongoDB Memory Server
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    if (
      args.some((arg) =>
        String(arg).includes('MongoDB Memory Server started')
      )
    ) {
      return; // Suppress MongoDB test logs
    }
    originalConsoleLog(...args);
  };

  // MongoDB Connection
  if (process.env.MONGODB_URI) {
    try {
      console.log(`🔗 Connecting to MongoDB at ${process.env.MONGODB_URI}...`);
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB connected successfully.');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      process.exit(1);
    }
  }
};
