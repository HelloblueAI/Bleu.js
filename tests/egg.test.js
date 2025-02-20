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
    const validEgg = new Egg({ type: 'test', status: 'active' });
    const savedEgg = await validEgg.save();

    expect(savedEgg).toBeDefined();
    expect(savedEgg._id).toBeDefined();
    expect(savedEgg.type).toBe('test');
    expect(savedEgg.status).toBe('active');
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
    expect(error.errors).toHaveProperty('type');
  });

  test('should retrieve an egg from the database', async () => {
    const egg = new Egg({ type: 'test', status: 'active' });
    await egg.save();

    const foundEgg = await Egg.findOne({ type: 'test' });

    expect(foundEgg).not.toBeNull();
    expect(foundEgg.type).toBe('test');
    expect(foundEgg.status).toBe('active');
  });

  test('should update an egg status', async () => {
    const egg = new Egg({ type: 'golden', status: 'inactive' });
    await egg.save();

    const updatedEgg = await Egg.findOneAndUpdate(
      { type: 'golden' },
      { status: 'active' },
      { new: true },
    );

    expect(updatedEgg).not.toBeNull();
    expect(updatedEgg.status).toBe('active');

    const count = await Egg.countDocuments({ status: 'active' });
    expect(count).toBe(1);
  });

  test('should delete an egg', async () => {
    const egg = new Egg({ type: 'silver', status: 'active' });
    await egg.save();

    const beforeDeleteCount = await Egg.countDocuments();
    await Egg.deleteOne({ type: 'silver' });
    const afterDeleteCount = await Egg.countDocuments();

    expect(beforeDeleteCount).toBe(1);
    expect(afterDeleteCount).toBe(0);

    const deletedEgg = await Egg.findOne({ type: 'silver' });
    expect(deletedEgg).toBeNull();
  });

  test('should not save duplicate eggs if type is unique', async () => {
    const egg1 = new Egg({ type: 'diamond', status: 'active' });
    await egg1.save();

    let error;
    try {
      const egg2 = new Egg({ type: 'diamond', status: 'inactive' });
      await egg2.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    if (error) {
      expect(error.code).toBe(11000); // MongoDB duplicate key error
    }
  });

  test('should return null when updating a non-existent egg', async () => {
    const updatedEgg = await Egg.findOneAndUpdate(
      { type: 'nonexistent' },
      { status: 'active' },
      { new: true },
    );

    expect(updatedEgg).toBeNull();
  });
});
