import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Egg } from '../src/models/egg';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    binary: {
      version: '6.0.4',
      systemBinary: '/usr/local/bin/mongod'
    }
  });
  const mongoUri = await mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
});

describe('Egg Model', () => {
  it('should create a new egg', async () => {
    const eggData = {
      name: 'Test Egg',
      description: 'A test egg',
      price: 5.99,
      quantity: 100,
      category: 'regular'
    };

    const egg = new Egg(eggData);
    const savedEgg = await egg.save();

    expect(savedEgg._id).toBeDefined();
    expect(savedEgg.name).toBe(eggData.name);
    expect(savedEgg.price).toBe(eggData.price);
    expect(savedEgg.quantity).toBe(eggData.quantity);
    expect(savedEgg.category).toBe(eggData.category);
  });

  it('should validate required fields', async () => {
    const egg = new Egg({});

    try {
      await egg.save();
      fail('Expected validation error');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
      expect(error.errors.price).toBeDefined();
      expect(error.errors.quantity).toBeDefined();
    }
  });

  it('should validate price is positive', async () => {
    const egg = new Egg({
      name: 'Test Egg',
      description: 'A test egg',
      price: -1,
      quantity: 100,
      category: 'regular'
    });

    try {
      await egg.save();
      fail('Expected validation error');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.errors.price).toBeDefined();
    }
  });

  it('should validate quantity is non-negative', async () => {
    const egg = new Egg({
      name: 'Test Egg',
      description: 'A test egg',
      price: 5.99,
      quantity: -1,
      category: 'regular'
    });

    try {
      await egg.save();
      fail('Expected validation error');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.errors.quantity).toBeDefined();
    }
  });
}); 