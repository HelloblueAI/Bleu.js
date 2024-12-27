const mongoose = require('mongoose');

const Rule = require('../models/ruleModel');

describe('Rule Model Tests', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/test-bleujs', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await Rule.deleteMany(); // Clear the collection before tests
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  test('should create and save a rule successfully', async () => {
    const ruleData = {
      name: 'Sunny Rule',
      data: 'Some example data',
      nested: { level1: { level2: 'Deeply nested data' } },
    };
    const rule = await Rule.create(ruleData);

    expect(rule._id).toBeDefined();
    expect(rule.name).toBe(ruleData.name);
    expect(rule.data).toBe(ruleData.data);
    expect(rule.nested.level1.level2).toBe(ruleData.nested.level1.level2);
  });

  test('should enforce unique name constraint', async () => {
    const ruleData = { name: 'Sunny Rule', data: 'Duplicate name test' };

    await expect(Rule.create(ruleData)).rejects.toThrow(/duplicate key error/);
  });

  test('should validate name field constraints', async () => {
    const invalidRule = new Rule({ name: 'AB', data: 'Short name test' });
    let validationError;

    try {
      await invalidRule.validate();
    } catch (err) {
      validationError = err;
    }

    expect(validationError.errors.name.message).toBe(
      'Rule name must be at least 3 characters long',
    );
  });

  test('should retrieve a rule by name using findByName', async () => {
    const rule = await Rule.findByName('Sunny Rule');
    expect(rule).not.toBeNull();
    expect(rule.name).toBe('Sunny Rule');
  });

  test('should serialize the rule correctly', async () => {
    const rule = await Rule.findByName('Sunny Rule');
    const serialized = rule.toJSON();
    expect(serialized).not.toHaveProperty('__v');
    expect(serialized.name).toBe('Sunny Rule');
  });

  test('should handle large data strings gracefully', async () => {
    const largeData = 'x'.repeat(501); // Exceeding the 500 character limit
    const rule = new Rule({ name: 'Large Data Rule', data: largeData });

    let validationError;
    try {
      await rule.validate();
    } catch (err) {
      validationError = err;
    }

    expect(validationError.errors.data.message).toBe(
      'Data field must not exceed 500 characters',
    );
  });

  test('should reject invalid nested structure', async () => {
    const invalidRule = new Rule({
      name: 'Invalid Nested Rule',
      nested: { level1: { level2: 123 } }, // Invalid type for level2
    });

    let validationError;
    try {
      await invalidRule.validate();
    } catch (err) {
      validationError = err;
    }

    expect(validationError.errors['nested.level1.level2'].message).toBe(
      'Cast to String failed for value "123" at path "nested.level1.level2"',
    );
  });
});
