const Bleu = require('../src/Bleu');

// Mock the HenFarm class
jest.mock('../src/HenFarm', () => {
  return jest.fn().mockImplementation(() => ({
    generateCode: jest.fn().mockReturnValue('Mock generated code'),
  }));
});

describe('Bleu', () => {
  let bleu;

  beforeEach(() => {
    bleu = new Bleu();
  });

  it('should generate a new egg', () => {
    const egg = bleu.generateEgg('Test description', 'model', {
      modelName: 'TestModel',
      fields: [{ name: 'field1', type: 'string' }],
    });
    expect(egg).toHaveProperty('id');
    expect(egg).toHaveProperty('description');
    expect(egg).toHaveProperty('type', 'model');
    expect(egg).toHaveProperty('code', 'Mock generated code');
  });

  it('should optimize code', () => {
    const code = 'function test() { let a = 1; return a + 2; }';
    const optimizedCode = bleu.optimizeCode(code);
    expect(optimizedCode).toBe('function test(){let a=1;return a+2;}');
  });

  it('should manage dependencies', () => {
    const dependencies = ['express', 'lodash'];
    const spy = jest.spyOn(console, 'log');
    bleu.manageDependencies(dependencies);
    expect(spy).toHaveBeenCalledWith('Managing dependency: express');
    expect(spy).toHaveBeenCalledWith('Managing dependency: lodash');
    spy.mockRestore();
  });

  it('should ensure code quality', () => {
    const goodCode = 'const a = 1;';
    const badCode = 'var a = 1;';
    expect(bleu.ensureCodeQuality(goodCode)).toBe(true);
    expect(bleu.ensureCodeQuality(badCode)).toBe(false);
  });

  it('should generate multiple eggs', () => {
    bleu.generateEggs(2, 'Test description', 'model', {
      modelName: 'TestModel',
      fields: [{ name: 'field1', type: 'string' }],
    });
    expect(bleu.eggs).toHaveLength(2);
  });

  it('should handle complex optimization', () => {
    const complexCode = `
      function test() {
        let a = 1;
        let b = 2;
        return a + b;
      }
    `;
    const optimizedCode = bleu.optimizeCode(complexCode);
    expect(optimizedCode).toBe('function test(){let a=1;let b=2;return a+b;}');
  });

  it('should debug code', () => {
    const spy = jest.spyOn(console, 'log');
    bleu.debugCode('const a = 1;');
    expect(spy).toHaveBeenCalledWith('Debugging code: const a = 1;');
    spy.mockRestore();
  });

  it('should generate correct description for model', () => {
    const egg = bleu.generateEgg('Test', 'model', {
      modelName: 'User',
      fields: [
        { name: 'name', type: 'string' },
        { name: 'age', type: 'number' },
      ],
    });
    expect(egg.description).toBe('Model User with fields name, age');
  });

  it('should generate correct description for utility', () => {
    const egg = bleu.generateEgg('Test', 'utility', {
      utilityName: 'StringUtils',
      methods: ['capitalize', 'reverse'],
    });
    expect(egg.description).toBe(
      'Utility StringUtils with methods capitalize, reverse',
    );
  });

  it('should throw error for unknown code type', () => {
    expect(() => {
      bleu.generateEgg('Test', 'unknown', {});
    }).toThrow('Unknown code type: unknown');
  });
});
