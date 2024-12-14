const Bleu = require('../src/Bleu');
// Move `@eggs-generator/HenFarm` import before `../src/Bleu`
// Also, make sure to have a blank line between import groups

// Mocking the HenFarm module
jest.mock('@eggs-generator/HenFarm', () => {
  return jest.fn().mockImplementation(() => ({
    generateCode: jest.fn((type, options) =>
      type === 'model'
        ? `class ${options.modelName} { ${options.fields.map((f) => `${f.name}: ${f.type};`).join(' ')} }`
        : `class ${options.utilityName} { ${options.methods.join(', ')} }`,
    ),
  }));
});

describe('Bleu', () => {
  let bleu;

  beforeEach(() => {
    bleu = new Bleu();
  });

  it('should generate a new egg with valid inputs', () => {
    const egg = bleu.generateEgg('Test Description', 'model', {
      modelName: 'User',
      fields: [
        { name: 'id', type: 'number' },
        { name: 'name', type: 'string' },
      ],
    });

    expect(egg).toHaveProperty('id', 1);
    expect(egg).toHaveProperty(
      'description',
      'Model User with fields id, name',
    );
    expect(egg).toHaveProperty('type', 'model');
    expect(egg).toHaveProperty('code');
  });

  it('should optimize code by removing extra spaces', () => {
    const code = 'function test() {    let a = 1; }';
    const optimized = bleu.optimizeCode(code);
    expect(optimized).toBe('function test() { let a = 1; }');
  });

  it('should manage dependencies', () => {
    const dependencies = [
      { name: 'express', version: '4.17.1' },
      { name: 'lodash', version: '4.17.21' },
    ];
    const spy = jest.spyOn(console, 'log');
    bleu.manageDependencies(dependencies);
    expect(spy).toHaveBeenCalledWith('Managing dependency: express@4.17.1');
    expect(spy).toHaveBeenCalledWith('Managing dependency: lodash@4.17.21');
    spy.mockRestore();
  });

  it('should ensure code quality', () => {
    expect(bleu.ensureCodeQuality('let a = 1;')).toBe(true);
    expect(bleu.ensureCodeQuality('var a = 1;')).toBe(false);
  });

  it('should generate multiple eggs', () => {
    bleu.generateEggs(3, 'Test Egg', 'model', {
      modelName: 'User',
      fields: [{ name: 'id', type: 'number' }],
    });
    expect(bleu.eggs).toHaveLength(3);
  });
});
