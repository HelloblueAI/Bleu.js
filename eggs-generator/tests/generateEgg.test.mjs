import { generateEgg } from '../src/generateEggs.js';

describe('generateEgg', () => {
  it('should generate an egg with valid inputs', () => {
    const options = {
      description: 'Test Egg',
      type: 'model',
      options: { field: 'value' },
    };

    const egg = generateEgg(options);

    expect(egg).toHaveProperty('id');
    expect(egg).toHaveProperty('description', options.description);
    expect(egg).toHaveProperty('type', options.type);
    expect(egg).toHaveProperty('options', options.options);
    expect(egg).toHaveProperty('createdAt');
  });

  it('should throw an error if required fields are missing', () => {
    const invalidOptions = {
      description: 'Test Egg',
    };

    expect(() => generateEgg(invalidOptions)).toThrow(
      'Missing required fields: description, type, or options',
    );
  });
});
