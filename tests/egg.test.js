import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Egg from '../src/models/egg.schema.js';

describe('Egg Model Tests', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Egg.deleteMany({});
  });

  test('should create and save an egg successfully', async () => {
    const validEgg = new Egg({
      id: 'egg-12345',
      owner: 'owner1',
      description: 'A celestial egg with cosmic powers',
      type: 'celestial', // Valid enum value
      status: 'created', // Valid enum value
      metadata: {
        dna: 'ACGT123456789',
        tags: ['rare', 'cosmic', 'powerful'],
        properties: {
          element: 'cosmic',
          size: 'medium',
          rarity: 'legendary',
          attributes: {
            power: 800,
            wisdom: 750,
            harmony: 600,
          },
        },
      },
    });

    const savedEgg = await validEgg.save();

    expect(savedEgg).toBeDefined();
    expect(savedEgg._id).toBeDefined();
    expect(savedEgg.type).toBe('celestial');
    expect(savedEgg.status).toBe('created');
    expect(savedEgg.metadata.properties.element).toBe('cosmic');
  });

  test('should fail to save an egg without required fields', async () => {
    const invalidEgg = new Egg({});
    let error;

    try {
      await invalidEgg.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.name).toBe('ValidationError');
    expect(error.errors).toHaveProperty('type');
    expect(error.errors).toHaveProperty('id');
    expect(error.errors).toHaveProperty('description');
    expect(error.errors).toHaveProperty('owner');
  });

  test('should retrieve an egg from the database', async () => {
    const egg = new Egg({
      id: 'egg-67890',
      owner: 'owner2',
      description: 'A dragon egg with fire powers',
      type: 'dragon',
      status: 'incubating',
      metadata: {
        dna: 'DRAGON123456',
        properties: {
          element: 'fire',
          size: 'large',
          rarity: 'rare',
        },
      },
      incubationConfig: {
        startTime: new Date(),
        duration: 86400000, // 24 hours
        temperature: 40,
        conditions: ['warm', 'bright'],
      },
    });

    await egg.save();

    const foundEgg = await Egg.findOne({ id: 'egg-67890' });

    expect(foundEgg).not.toBeNull();
    expect(foundEgg.type).toBe('dragon');
    expect(foundEgg.status).toBe('incubating');
    expect(foundEgg.metadata.properties.element).toBe('fire');
  });

  test('should update an egg status', async () => {
    const egg = new Egg({
      id: 'egg-update-test',
      owner: 'owner3',
      description: 'A phoenix egg ready to hatch',
      type: 'phoenix',
      status: 'incubating',
      metadata: {
        dna: 'PHOENIX98765',
        properties: {
          element: 'fire',
          size: 'medium',
          rarity: 'epic',
        },
      },
    });

    await egg.save();

    const updatedEgg = await Egg.findOneAndUpdate(
      { id: 'egg-update-test' },
      { status: 'hatched' },
      { new: true },
    );

    expect(updatedEgg).not.toBeNull();
    expect(updatedEgg.status).toBe('hatched');

    const count = await Egg.countDocuments({ status: 'hatched' });
    expect(count).toBe(1);
  });

  test('should delete an egg', async () => {
    const egg = new Egg({
      id: 'egg-delete-test',
      owner: 'owner4',
      description: 'An elemental egg to be deleted',
      type: 'elemental',
      status: 'created',
      metadata: {
        dna: 'ELEMDELETE123',
        properties: {
          element: 'earth',
          size: 'small',
          rarity: 'common',
        },
      },
    });

    await egg.save();

    const beforeDeleteCount = await Egg.countDocuments();
    await Egg.deleteOne({ id: 'egg-delete-test' });
    const afterDeleteCount = await Egg.countDocuments();

    expect(beforeDeleteCount).toBe(1);
    expect(afterDeleteCount).toBe(0);

    const deletedEgg = await Egg.findOne({ id: 'egg-delete-test' });
    expect(deletedEgg).toBeNull();
  });

  test('should not save duplicate eggs with same DNA', async () => {
    const egg1 = new Egg({
      id: 'egg-dupe-test-1',
      owner: 'owner5',
      description: 'First cosmic egg',
      type: 'cosmic',
      status: 'created',
      metadata: {
        dna: 'DUPLICATE-DNA-123',
        properties: {
          element: 'void',
          size: 'large',
          rarity: 'mythical',
        },
      },
    });

    await egg1.save();

    let error;
    try {
      const egg2 = new Egg({
        id: 'egg-dupe-test-2',
        owner: 'owner6',
        description: 'Second cosmic egg with same DNA',
        type: 'cosmic',
        status: 'created',
        metadata: {
          dna: 'DUPLICATE-DNA-123', // Same DNA as egg1
          properties: {
            element: 'void',
            size: 'medium',
            rarity: 'legendary',
          },
        },
      });

      await egg2.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.code).toBe(11000); // MongoDB duplicate key error
  });

  test('should return null when updating a non-existent egg', async () => {
    const updatedEgg = await Egg.findOneAndUpdate(
      { id: 'nonexistent-egg' },
      { status: 'hatched' },
      { new: true },
    );

    expect(updatedEgg).toBeNull();
  });

  test('should calculate market value correctly', async () => {
    const egg = new Egg({
      id: 'egg-market-test',
      owner: 'owner7',
      description: 'A legendary celestial egg',
      type: 'celestial',
      status: 'created',
      metadata: {
        dna: 'MARKET-VALUE-TEST',
        properties: {
          element: 'cosmic',
          size: 'large',
          rarity: 'legendary',
          attributes: {
            power: 900,
            wisdom: 800,
            harmony: 700,
            speed: 600,
            resilience: 500,
          },
        },
      },
    });

    await egg.save();
    const savedEgg = await Egg.findOne({ id: 'egg-market-test' });

    const marketValue = savedEgg.calculateMarketValue();
    expect(marketValue).toBeGreaterThan(0);

    expect(marketValue).toBeGreaterThan(500);
  });

  test('should track incubation progress correctly', async () => {
    // Create an egg that started incubating 12 hours ago
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

    const egg = new Egg({
      id: 'egg-incubation-test',
      owner: 'owner8',
      description: 'An incubating dragon egg',
      type: 'dragon',
      status: 'incubating',
      metadata: {
        dna: 'INCUBATION-TEST',
        properties: {
          element: 'fire',
          size: 'medium',
          rarity: 'rare',
        },
      },
      incubationConfig: {
        startTime: twelveHoursAgo,
        duration: 24 * 60 * 60 * 1000, // 24 hours
        temperature: 38,
        conditions: ['warm', 'dark'],
      },
    });

    await egg.save();
    const savedEgg = await Egg.findOne({ id: 'egg-incubation-test' });

    // Progress should be around 50% (12 hours of 24 hours)
    expect(savedEgg.incubationProgress).toBeGreaterThanOrEqual(45);
    expect(savedEgg.incubationProgress).toBeLessThanOrEqual(55);
  });
});
