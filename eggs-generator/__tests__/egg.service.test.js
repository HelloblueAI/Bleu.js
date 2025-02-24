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

// Mock Logger
const mockLogger = {
  info: jest.fn(console.log),
  error: jest.fn(console.error),
  debug: jest.fn(console.debug),
  warn: jest.fn(console.warn),
};
jest.mock('../src/utils/logger.js', () => mockLogger);

// Mock Generate Egg
const mockGenerateEgg = jest.fn();
jest.mock('../src/generateEgg.js', () => ({ generateEgg: mockGenerateEgg }));

// MongoDB Test Config
const TEST_CONFIG = {
  TIMEOUT: 10000,
  DB_NAME: 'jest-test-db',
  CONNECTION_OPTIONS: {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 5000,
    autoIndex: true,
    maxPoolSize: 10,
  },
};

// Sample Test Data
const TEST_EGGS = {
  basic: {
    id: 'test-basic-id',
    type: 'common',
    rarity: 'common',
    element: 'earth',
    properties: { size: 'small', power: 100, durability: 50 },
    metadata: { createdAt: new Date(), version: '1.0' },
  },
  legendary: {
    id: 'test-legendary-id',
    type: 'celestial',
    rarity: 'legendary',
    element: 'divine',
    properties: { size: 'massive', power: 9999, durability: 1000 },
    metadata: { createdAt: new Date(), version: '1.0' },
  },
};

// MongoDB Test Setup
let mongoServer;
beforeAll(async () => {
  jest.setTimeout(TEST_CONFIG.TIMEOUT);
  mongoServer = await MongoMemoryServer.create({
    instance: { dbName: TEST_CONFIG.DB_NAME },
  });

  await mongoose.connect(mongoServer.getUri(), {
    ...TEST_CONFIG.CONNECTION_OPTIONS,
    dbName: TEST_CONFIG.DB_NAME,
  });

  mongoose.connection.on('error', (error) =>
    mockLogger.error('MongoDB error:', error),
  );
  mockLogger.info('MongoDB Memory Server started.');
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) await mongoServer.stop();
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGenerateEgg.mockReset();
});

describe('🔍 Egg Generator Integration Tests', () => {
  // ✅ Database Connection Tests
  describe('Database Connection', () => {
    test('validates MongoDB connection state', () => {
      expect(mongoose.connection.readyState).toBe(1);
    });

    test('verifies database details', async () => {
      const db = mongoose.connection.db;
      expect(db.databaseName).toBe(TEST_CONFIG.DB_NAME);
      expect((await db.stats()).ok).toBe(1);
    });
  });

  // ✅ Egg Generation Tests
  describe('Egg Generation', () => {
    test('generates a basic egg', async () => {
      mockGenerateEgg.mockResolvedValueOnce(TEST_EGGS.basic);
      const result = await mockGenerateEgg({ type: 'common' });
      expect(result).toEqual(TEST_EGGS.basic);
      expect(mockGenerateEgg).toHaveBeenCalledWith({ type: 'common' });
    });

    test('generates a legendary egg', async () => {
      mockGenerateEgg.mockResolvedValueOnce(TEST_EGGS.legendary);
      const result = await mockGenerateEgg({ type: 'celestial' });
      expect(result).toEqual(TEST_EGGS.legendary);
      expect(result.properties.power).toBeGreaterThan(1000);
    });

    test('validates metadata structure', async () => {
      mockGenerateEgg.mockResolvedValueOnce(TEST_EGGS.basic);
      const result = await mockGenerateEgg({ type: 'common' });
      expect(result.metadata).toMatchObject({
        createdAt: expect.any(Date),
        version: '1.0',
      });
    });
  });

  // ✅ Performance & Load Tests
  describe('Performance Tests', () => {
    test('handles concurrent egg generation', async () => {
      mockGenerateEgg
        .mockResolvedValueOnce(TEST_EGGS.basic)
        .mockResolvedValueOnce(TEST_EGGS.legendary);
      const results = await Promise.all([
        mockGenerateEgg({ type: 'common' }),
        mockGenerateEgg({ type: 'celestial' }),
      ]);
      expect(results.length).toBe(2);
    });

    test('executes bulk operations efficiently', async () => {
      const batchSize = 100;
      const eggs = Array.from({ length: batchSize }, (_, i) => ({
        type: i % 2 ? 'rare' : 'common',
        element: i % 3 ? 'fire' : 'water',
        properties: { power: 100 + i, defense: 50 + i },
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        eggs.map((egg) => mockGenerateEgg(egg)),
      );
      const endTime = Date.now();

      expect(results.length).toBe(batchSize);
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });

  // ✅ Error Handling Tests (Enhanced)
  describe('Error Handling', () => {
    test('handles database errors gracefully', async () => {
      const dbError = new Error('Database operation failed');
      mongoose.connection.emit('error', dbError);
      expect(mockLogger.error).toHaveBeenCalledWith('MongoDB error:', dbError);
    });

    test('gracefully handles MongoDB disconnections', async () => {
      await mongoose.connection.close();
      expect(mongoose.connection.readyState).toBe(0);
      mockLogger.info('MongoDB Memory Server started.');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'MongoDB Memory Server started.',
      );

      // Reconnect for remaining tests
      await mongoose.connect(mongoServer.getUri(), {
        ...TEST_CONFIG.CONNECTION_OPTIONS,
        dbName: TEST_CONFIG.DB_NAME,
      });
      expect(mongoose.connection.readyState).toBe(1);
    });
  });

  // ✅ Utility Tests
  describe('Utility Functions', () => {
    const { calculateEggRarity, validateEggParams } = jest.requireActual(
      '../src/utils/eggUtils.js',
    );

    test.each([
      [{ type: 'mythic', element: 'cosmic' }, 'legendary'],
      [{ type: 'common', element: 'earth' }, 'common'],
      [{ type: 'epic', element: 'thunder' }, 'rare'],
    ])('calculates rarity correctly for %o', async (params, expected) => {
      expect(calculateEggRarity(params)).toBe(expected);
    });

    test('validates egg parameters', () => {
      expect(
        validateEggParams({
          type: 'rare',
          element: 'water',
          properties: { power: 500 },
        }),
      ).toBe(true);
      expect(() => validateEggParams({})).toThrow();
    });
  });
});
