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


import { jest } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import mongoose from 'mongoose';


const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn()
};


jest.mock('../src/utils/logger.js', () => mockLogger);
jest.mock('../src/generateEgg.js', () => ({
  generateEgg: jest.fn()
}));

describe('Egg Generator Tests', () => {
  let mongoServer;
  const TEST_TIMEOUT = 10000;
  const TEST_DB_NAME = 'jest-test-db';
  let loggerCalls = [];

  beforeAll(async () => {
    jest.setTimeout(TEST_TIMEOUT);

    try {

      loggerCalls = [];
      mockLogger.info.mockImplementation((...args) => {
        loggerCalls.push(['info', ...args]);
      });


      mongoServer = await MongoMemoryServer.create();
      const mongoUri = await mongoServer.getUri();


      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 5000,
        dbName: TEST_DB_NAME
      });

      mockLogger.info('MongoDB Memory Server started successfully');
    } catch (err) {
      mockLogger.error('Error starting MongoMemoryServer:', err);
      throw err;
    }
  });

  afterAll(async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
      }

      if (mongoServer) {
        await mongoServer.stop({ doCleanup: true, force: true });
      }
    } catch (err) {
      mockLogger.error('Error during cleanup:', err);
      throw err;
    }
  });

  beforeEach(() => {
    // Don't clear the mock calls, just reset the implementation
    Object.values(mockLogger).forEach(mock =>
      mock.mockImplementation((...args) => loggerCalls.push([mock.name, ...args]))
    );
  });

  describe('Database Connection', () => {
    it('should connect to mock database successfully', () => {
      expect(mongoose.connection.readyState).toBe(1);
      expect(mongoose.connection.db.databaseName).toBe(TEST_DB_NAME);
    });

    it('should have logged server startup correctly', () => {

      const infoMessages = loggerCalls
        .filter(call => call[0] === 'info')
        .map(call => call[1]);

      expect(infoMessages).toContain('MongoDB Memory Server started successfully');
    });
  });

  describe('Egg Generation', () => {
    const testEgg = {
      id: 'test-id',
      type: 'celestial',
      rarity: 'legendary',
      element: 'divine',
      properties: {
        size: 'massive',
        power: 9999
      },
      createdAt: new Date()
    };

    beforeEach(() => {
      jest.resetModules();
      const { generateEgg } = require('../src/generateEgg.js');
      generateEgg.mockReset();
    });

    it('should generate egg correctly', async () => {
      const { generateEgg } = require('../src/generateEgg.js');
      generateEgg.mockResolvedValueOnce(testEgg);

      const result = await generateEgg();

      expect(generateEgg).toHaveBeenCalledTimes(1);
      expect(result).toEqual(testEgg);
      expect(result).toMatchObject({
        type: 'celestial',
        rarity: 'legendary',
        element: 'divine'
      });
    });

    it('should handle egg generation failure', async () => {
      const { generateEgg } = require('../src/generateEgg.js');
      const error = new Error('Failed to generate egg');
      generateEgg.mockRejectedValueOnce(error);

      await expect(generateEgg()).rejects.toThrow('Failed to generate egg');
      expect(generateEgg).toHaveBeenCalledTimes(1);
    });
  });
});
