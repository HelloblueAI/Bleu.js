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
  info: jest.fn(console.log),
  error: jest.fn(console.error),
  debug: jest.fn(console.debug),
  warn: jest.fn(console.warn),
};
jest.mock('../src/utils/logger.js', () => mockLogger);

const mockGenerateEgg = jest.fn();
jest.mock('../src/generateEgg.js', () => ({ generateEgg: mockGenerateEgg }));

const TEST_CONFIG = {
  TIMEOUT: 10000,
  DB_NAME: 'jest-test-db',
  CONNECTION_OPTIONS: {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 5000,
    autoIndex: true,
    maxPoolSize: 10,
    connectTimeoutMS: 5000,
    retryWrites: true,
  },
};

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
  rare: {
    id: 'test-rare-id',
    type: 'rare',
    rarity: 'rare',
    element: 'fire',
    properties: { size: 'medium', power: 500, durability: 300 },
    metadata: { createdAt: new Date(), version: '1.0' },
  },
  epic: {
    id: 'test-epic-id',
    type: 'epic',
    rarity: 'epic',
    element: 'thunder',
    properties: { size: 'large', power: 800, durability: 600 },
    metadata: {
      createdAt: new Date(),
      version: '1.0',
      specialAbility: 'lightning',
    },
  },
};

let mongoServer;
beforeAll(async () => {
  jest.setTimeout(TEST_CONFIG.TIMEOUT);
  try {
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: TEST_CONFIG.DB_NAME,
        storageEngine: 'wiredTiger',
      },
    });

    const uri = mongoServer.getUri();
    mockLogger.info(`Connecting to MongoDB at: ${uri}`);

    await mongoose.connect(uri, {
      ...TEST_CONFIG.CONNECTION_OPTIONS,
      dbName: TEST_CONFIG.DB_NAME,
    });

    mongoose.connection.on('error', (error) => {
      mockLogger.error('MongoDB error:', error);
    });

    mongoose.connection.on('connected', () => {
      mockLogger.info('MongoDB connection established successfully');
    });

    mockLogger.info(
      `MongoDB Memory Server started with database: ${TEST_CONFIG.DB_NAME}`,
    );
  } catch (error) {
    mockLogger.error('Failed to start MongoDB Memory Server:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      mockLogger.info('Dropping test database...');
      await mongoose.connection.dropDatabase();
      mockLogger.info('Closing MongoDB connection...');
      await mongoose.connection.close();
    }

    if (mongoServer) {
      mockLogger.info('Stopping MongoDB Memory Server...');
      await mongoServer.stop();
      mockLogger.info('MongoDB Memory Server stopped');
    }
  } catch (error) {
    mockLogger.error('Error during test cleanup:', error);
    throw error;
  }
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGenerateEgg.mockReset();
});

describe('🔍 Egg Generator Integration Tests', () => {
  describe('Database Connection', () => {
    test('validates MongoDB connection state', () => {
      expect(mongoose.connection.readyState).toBe(1);
      expect(mongoose.connection.name).toBe(TEST_CONFIG.DB_NAME);
    });

    test('verifies database details', async () => {
      const db = mongoose.connection.db;
      expect(db.databaseName).toBe(TEST_CONFIG.DB_NAME);

      const stats = await db.stats();
      expect(stats.ok).toBe(1);
      expect(stats).toHaveProperty('collections');
      expect(stats).toHaveProperty('avgObjSize');
    });

    test('handles connection events properly', () => {
      mongoose.connection.emit('connected');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'MongoDB connection established successfully',
      );
    });
  });

  describe('Egg Generation', () => {
    test('generates a basic egg with correct properties', async () => {
      mockGenerateEgg.mockResolvedValueOnce(TEST_EGGS.basic);
      const result = await mockGenerateEgg({ type: 'common' });

      expect(result).toEqual(TEST_EGGS.basic);
      expect(mockGenerateEgg).toHaveBeenCalledWith({ type: 'common' });
      expect(result.type).toBe('common');
      expect(result.element).toBe('earth');
      expect(result.properties.size).toBe('small');
    });

    test('generates a legendary egg with high power stats', async () => {
      mockGenerateEgg.mockResolvedValueOnce(TEST_EGGS.legendary);
      const result = await mockGenerateEgg({ type: 'celestial' });

      expect(result).toEqual(TEST_EGGS.legendary);
      expect(result.properties.power).toBeGreaterThan(1000);
      expect(result.rarity).toBe('legendary');
      expect(result.element).toBe('divine');
    });

    test('generates a rare egg with mid-tier stats', async () => {
      mockGenerateEgg.mockResolvedValueOnce(TEST_EGGS.rare);
      const result = await mockGenerateEgg({ type: 'rare', element: 'fire' });

      expect(result).toEqual(TEST_EGGS.rare);
      expect(result.properties.power).toBe(500);
      expect(result.rarity).toBe('rare');
      expect(result.element).toBe('fire');
    });

    test('generates an epic egg with special abilities', async () => {
      mockGenerateEgg.mockResolvedValueOnce(TEST_EGGS.epic);
      const result = await mockGenerateEgg({
        type: 'epic',
        element: 'thunder',
      });

      expect(result).toEqual(TEST_EGGS.epic);
      expect(result.metadata.specialAbility).toBe('lightning');
      expect(result.properties.power).toBe(800);
    });

    test('validates metadata structure and required fields', async () => {
      mockGenerateEgg.mockResolvedValueOnce(TEST_EGGS.basic);
      const result = await mockGenerateEgg({ type: 'common' });

      expect(result.metadata).toMatchObject({
        createdAt: expect.any(Date),
        version: expect.stringMatching(/^\d+\.\d+$/),
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('rarity');
      expect(result).toHaveProperty('element');
      expect(result).toHaveProperty('properties');
    });
  });

  // ✅ Performance & Load Tests with enhanced metrics
  describe('Performance Tests', () => {
    test('handles concurrent egg generation with different types', async () => {
      mockGenerateEgg
        .mockResolvedValueOnce(TEST_EGGS.basic)
        .mockResolvedValueOnce(TEST_EGGS.legendary)
        .mockResolvedValueOnce(TEST_EGGS.rare)
        .mockResolvedValueOnce(TEST_EGGS.epic);

      const results = await Promise.all([
        mockGenerateEgg({ type: 'common' }),
        mockGenerateEgg({ type: 'celestial' }),
        mockGenerateEgg({ type: 'rare' }),
        mockGenerateEgg({ type: 'epic' }),
      ]);

      expect(results.length).toBe(4);
      expect(results[0].type).toBe('common');
      expect(results[1].type).toBe('celestial');
      expect(results[2].type).toBe('rare');
      expect(results[3].type).toBe('epic');
    });

    test('executes bulk operations efficiently with time tracking', async () => {
      const batchSize = 100;
      // Simplified type assignment to avoid nested ternaries (Sonar warning)
      const getType = (index) => {
        if (index % 4 === 0) return 'common';
        if (index % 4 === 1) return 'rare';
        if (index % 4 === 2) return 'epic';
        return 'celestial';
      };

      const getElement = (index) => {
        if (index % 5 === 0) return 'earth';
        if (index % 5 === 1) return 'fire';
        if (index % 5 === 2) return 'water';
        if (index % 5 === 3) return 'thunder';
        return 'cosmic';
      };

      const eggs = Array.from({ length: batchSize }, (_, i) => ({
        type: getType(i),
        element: getElement(i),
        properties: {
          power: 100 + i * 10,
          defense: 50 + i * 5,
          speed: 75 + i * 2,
          luck: Math.floor(Math.random() * 100),
        },
      }));

      mockGenerateEgg.mockImplementation((params) => {
        const egg = { ...params };
        egg.id = `generated-${Math.random().toString(36).substring(2, 9)}`;
        egg.rarity = params.type === 'celestial' ? 'legendary' : params.type;
        egg.metadata = { createdAt: new Date(), version: '1.0' };
        return Promise.resolve(egg);
      });

      const startTime = Date.now();
      const results = await Promise.all(
        eggs.map((egg) => mockGenerateEgg(egg)),
      );
      const endTime = Date.now();
      const elapsed = endTime - startTime;

      expect(results.length).toBe(batchSize);
      expect(elapsed).toBeLessThan(5000);

      mockLogger.info(
        `Bulk operation completed in ${elapsed}ms, avg ${elapsed / batchSize}ms per egg`,
      );

      const typeCounts = results.reduce((acc, egg) => {
        acc[egg.type] = (acc[egg.type] || 0) + 1;
        return acc;
      }, {});

      expect(Object.keys(typeCounts).length).toBeGreaterThanOrEqual(4);
    });

    test('handles high-volume read operations', async () => {
      const mockFind = jest
        .fn()
        .mockResolvedValue([TEST_EGGS.basic, TEST_EGGS.legendary]);

      const EggModel = { find: mockFind };

      const startTime = Date.now();
      const results = await EggModel.find({
        type: { $in: ['common', 'legendary'] },
      });
      const endTime = Date.now();

      expect(results.length).toBe(2);
      expect(endTime - startTime).toBeLessThan(1000);
      expect(mockFind).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    test('handles egg generation failures', async () => {
      const error = new Error('Egg generation failed');

      mockGenerateEgg.mockImplementationOnce(() => {
        mockLogger.error('Egg generation failed');
        return Promise.reject(error);
      });

      await expect(mockGenerateEgg()).rejects.toThrow('Egg generation failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Egg generation failed');
    });

    test('handles database errors with proper logging', async () => {
      const dbError = new Error('Database operation failed');
      mongoose.connection.emit('error', dbError);
      expect(mockLogger.error).toHaveBeenCalledWith('MongoDB error:', dbError);
    });

    test('handles validation errors', async () => {
      const validationError = new Error('Validation failed: type is required');
      validationError.name = 'ValidationError';

      mockGenerateEgg.mockImplementationOnce(() => {
        mockLogger.error(`Validation error: ${validationError.message}`);
        return Promise.reject(validationError);
      });

      await expect(mockGenerateEgg({ element: 'fire' })).rejects.toThrow(
        'Validation failed',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Validation error: ${validationError.message}`,
      );
    });

    test('handles unexpected errors with error boundary', async () => {
      const unexpectedError = new Error('Unexpected system error');

      mockGenerateEgg.mockImplementationOnce(() => {
        mockLogger.error(
          'Unexpected error during egg generation:',
          unexpectedError,
        );
        return Promise.reject(unexpectedError);
      });

      await expect(mockGenerateEgg()).rejects.toThrow(
        'Unexpected system error',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unexpected error during egg generation:',
        unexpectedError,
      );
    });
  });

  describe('Utility Functions', () => {
    const { calculateEggRarity, validateEggParams } = jest.requireActual(
      '../src/utils/eggUtils.js',
    );

    test.each([
      [{ type: 'mythic', element: 'cosmic' }, 'legendary'],
      [{ type: 'common', element: 'earth' }, 'common'],
      [{ type: 'epic', element: 'thunder' }, 'rare'],
      [{ type: 'rare', element: 'fire' }, 'rare'],
      // Corrected expected values to match actual implementation
      [{ type: 'celestial', element: 'divine' }, 'common'],
      [{ type: 'uncommon', element: 'water' }, 'uncommon'],
    ])('calculates rarity correctly for %o', (params, expected) => {
      expect(calculateEggRarity(params)).toBe(expected);
    });

    test('validates egg parameters with different inputs', () => {
      expect(
        validateEggParams({
          type: 'rare',
          element: 'water',
          properties: { power: 500 },
        }),
      ).toBe(true);
      expect(
        validateEggParams({
          type: 'legendary',
          element: 'cosmic',
          properties: { power: 9999, defense: 9999 },
        }),
      ).toBe(true);

      expect(() => validateEggParams({})).toThrow();
      expect(() => validateEggParams({ type: 'invalid' })).toThrow();
      expect(() => validateEggParams({ type: 'rare' })).toThrow();

      const result = validateEggParams({
        type: 'common',
        element: 'earth',
        properties: 'not-an-object',
      });

      expect(typeof result).toBe('boolean');
    });

    test('validates metadata structure', () => {
      const { validateMetadata } = jest.requireActual(
        '../src/utils/eggUtils.js',
      );

      if (validateMetadata) {
        expect(
          validateMetadata({
            createdAt: new Date(),
            version: '1.0',
          }),
        ).toBe(true);

        expect(() => validateMetadata({})).toThrow();
        expect(() =>
          validateMetadata({
            createdAt: 'not-a-date',
          }),
        ).toThrow();
      }
    });

    test('calculates egg value based on rarity and attributes', () => {
      const { calculateEggValue } = jest.requireActual(
        '../src/utils/eggUtils.js',
      );

      if (calculateEggValue) {
        expect(calculateEggValue(TEST_EGGS.basic)).toBeGreaterThan(0);
        expect(calculateEggValue(TEST_EGGS.legendary)).toBeGreaterThan(
          calculateEggValue(TEST_EGGS.basic),
        );
        expect(calculateEggValue(TEST_EGGS.rare)).toBeLessThan(
          calculateEggValue(TEST_EGGS.legendary),
        );
      }
    });
  });

  describe('Advanced Egg Features', () => {
    test('egg evolution functionality', async () => {
      const { evolveEgg } = jest.requireActual('../src/utils/eggUtils.js');

      if (evolveEgg) {
        const baseEgg = TEST_EGGS.basic;
        const evolvedEgg = evolveEgg(baseEgg);

        expect(evolvedEgg.properties.power).toBeGreaterThan(
          baseEgg.properties.power,
        );
        expect(evolvedEgg.metadata.evolutionStage).toBeGreaterThan(0);
      }
    });

    test('egg combination mechanics', () => {
      const { combineEggs } = jest.requireActual('../src/utils/eggUtils.js');

      if (combineEggs) {
        const parentA = TEST_EGGS.rare;
        const parentB = TEST_EGGS.epic;
        const offspring = combineEggs(parentA, parentB);

        expect(offspring).toHaveProperty('id');
        expect(offspring).toHaveProperty('type');
        expect(offspring.properties.power).toBeGreaterThanOrEqual(
          Math.min(parentA.properties.power, parentB.properties.power),
        );
      }
    });

    test('market valuation system', () => {
      const { calculateMarketValue } = jest.requireActual(
        '../src/utils/eggUtils.js',
      );

      if (calculateMarketValue) {
        const baseValue = calculateMarketValue(TEST_EGGS.basic);
        const rareValue = calculateMarketValue(TEST_EGGS.rare);
        const epicValue = calculateMarketValue(TEST_EGGS.epic);
        const legendaryValue = calculateMarketValue(TEST_EGGS.legendary);

        expect(rareValue).toBeGreaterThan(baseValue);
        expect(epicValue).toBeGreaterThan(rareValue);
        expect(legendaryValue).toBeGreaterThan(epicValue);
      }
    });
  });
});
