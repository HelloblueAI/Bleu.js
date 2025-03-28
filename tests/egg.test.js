const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { Egg } = require('../src/models/egg.schema');

describe('Egg Schema', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Egg.deleteMany({});
  });

  it('should create an egg with valid data', async () => {
    const validEggData = {
      name: 'Test Egg',
      description: 'A test egg',
      attributes: [{
        trait_type: 'Color',
        value: 'Blue'
      }],
      generation: 1,
      rarity: 'common',
      dna: '0x123456789',
      birthDate: new Date(),
      owner: new mongoose.Types.ObjectId(),
      metadata: {
        test: 'data'
      }
    };

    const egg = new Egg(validEggData);
    const savedEgg = await egg.save();
    
    expect(savedEgg._id).toBeDefined();
    expect(savedEgg.name).toBe(validEggData.name);
    expect(savedEgg.attributes[0].trait_type).toBe(validEggData.attributes[0].trait_type);
  });

  it('should fail to create egg without required fields', async () => {
    const invalidEgg = new Egg({});
    
    let error;
    try {
      await invalidEgg.save();
    } catch (e) {
      error = e;
    }
    
    expect(error).toBeDefined();
    expect(error.errors.name).toBeDefined();
    expect(error.errors.dna).toBeDefined();
    expect(error.errors.attributes).toBeDefined();
  });

  it('should validate attribute structure', async () => {
    const eggWithInvalidAttribute = new Egg({
      name: 'Test Egg',
      description: 'A test egg',
      attributes: [{
        value: 'Blue' // Missing trait_type
      }],
      dna: '0x123456789'
    });

    let error;
    try {
      await eggWithInvalidAttribute.save();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors['attributes.0.trait_type']).toBeDefined();
  });

  it('should validate rarity enum values', async () => {
    const eggWithInvalidRarity = new Egg({
      name: 'Test Egg',
      description: 'A test egg',
      attributes: [{
        trait_type: 'Color',
        value: 'Blue'
      }],
      dna: '0x123456789',
      rarity: 'invalid'
    });

    let error;
    try {
      await eggWithInvalidRarity.save();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.rarity).toBeDefined();
  });

  it('should set default values', async () => {
    const egg = new Egg({
      name: 'Test Egg',
      description: 'A test egg',
      attributes: [{
        trait_type: 'Color',
        value: 'Blue'
      }],
      dna: '0x123456789'
    });

    const savedEgg = await egg.save();
    
    expect(savedEgg.generation).toBe(1);
    expect(savedEgg.rarity).toBe('common');
    expect(savedEgg.birthDate).toBeDefined();
    expect(savedEgg.createdAt).toBeDefined();
    expect(savedEgg.updatedAt).toBeDefined();
  });

  it('should validate DNA format', async () => {
    const eggWithInvalidDNA = new Egg({
      name: 'Test Egg',
      description: 'A test egg',
      attributes: [{
        trait_type: 'Color',
        value: 'Blue'
      }],
      dna: 'invalid'
    });

    let error;
    try {
      await eggWithInvalidDNA.save();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.errors.dna).toBeDefined();
  });

  it('should calculate age virtual correctly', async () => {
    const birthDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
    const egg = new Egg({
      name: 'Test Egg',
      description: 'A test egg',
      attributes: [{
        trait_type: 'Color',
        value: 'Blue'
      }],
      dna: '0x123456789',
      birthDate
    });

    const savedEgg = await egg.save();
    expect(savedEgg.age).toBe(5);
  });

  it('should evolve and increment generation', async () => {
    const egg = new Egg({
      name: 'Test Egg',
      description: 'A test egg',
      attributes: [{
        trait_type: 'Color',
        value: 'Blue'
      }],
      dna: '0x123456789'
    });

    await egg.save();
    const evolvedEgg = await egg.evolve();
    
    expect(evolvedEgg.generation).toBe(2);
  });

  it('should find egg by DNA using static method', async () => {
    const dna = '0x123456789';
    const egg = new Egg({
      name: 'Test Egg',
      description: 'A test egg',
      attributes: [{
        trait_type: 'Color',
        value: 'Blue'
      }],
      dna
    });

    await egg.save();
    const foundEgg = await Egg.findByDNA(dna);
    
    expect(foundEgg).toBeDefined();
    expect(foundEgg.dna).toBe(dna);
  });
});
