import Bleu from '../src/Bleu';
import HenFarm from '../src/HenFarm';

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

  it('should generate a new egg with valid inputs', () => {
    const egg = bleu.generateEgg('Test description', 'model', {
      modelName: 'TestModel',
      fields: [{ name: 'field1', type: 'string' }],
    });
    expect(egg).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        description: 'Test description',
        type: 'model',
        code: 'Mock generated code',
      })
    );
  });

  it('should optimize simple code', () => {
    const code = 'function test() { let a = 1; return a + 2; }';
    const optimizedCode = bleu.optimizeCode(code);
    expect(optimizedCode).toBe('function test(){let a=1;return a+2;}');
  });

  it('should optimize complex code', () => {
    const complexCode = `
      function test() {
        let a = 1;
        let b = 2;
        return a + b;
      }
      const anotherTest = () => {
        console.log('This is a test');
      };
    `;
    const optimizedCode = bleu.optimizeCode(complexCode);
    expect(optimizedCode).toBe(
      "function test(){let a=1;let b=2;return a+b;}const anotherTest=()=>{console.log('This is a test');};"
    );
  });

  it('should manage dependencies and log them', () => {
    const dependencies = ['express', 'lodash', 'axios'];
    const spy = jest.spyOn(console, 'log');
    bleu.manageDependencies(dependencies);
    dependencies.forEach((dep) => {
      expect(spy).toHaveBeenCalledWith(`Managing dependency: ${dep}`);
    });
    spy.mockRestore();
  });

  it('should ensure code quality for valid and invalid code', () => {
    const validCode = 'const a = 1;';
    const invalidCode = 'var a = 1;';
    expect(bleu.ensureCodeQuality(validCode)).toBe(true);
    expect(bleu.ensureCodeQuality(invalidCode)).toBe(false);
  });

  it('should generate and validate multiple eggs', () => {
    const eggs = bleu.generateEggs(5, 'Bulk Test Description', 'model', {
      modelName: 'BulkModel',
      fields: [{ name: 'bulkField', type: 'number' }],
    });
    expect(eggs).toHaveLength(5);
    eggs.forEach((egg) => {
      expect(egg).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          description: 'Bulk Test Description',
          type: 'model',
          code: 'Mock generated code',
        })
      );
    });
  });

  it('should debug code effectively', () => {
    const spy = jest.spyOn(console, 'log');
    const debugCode = 'function debug() { return 42; }';
    bleu.debugCode(debugCode);
    expect(spy).toHaveBeenCalledWith(`Debugging code: ${debugCode}`);
    spy.mockRestore();
  });

  it('should generate correct description for models', () => {
    const egg = bleu.generateEgg('Test', 'model', {
      modelName: 'User',
      fields: [
        { name: 'name', type: 'string' },
        { name: 'age', type: 'number' },
      ],
    });
    expect(egg.description).toBe('Model User with fields name, age');
  });

  it('should generate correct description for utilities', () => {
    const egg = bleu.generateEgg('Test', 'utility', {
      utilityName: 'StringUtils',
      methods: ['capitalize', 'reverse', 'trim'],
    });
    expect(egg.description).toBe(
      'Utility StringUtils with methods capitalize, reverse, trim'
    );
  });

  it('should throw an error for unknown code types', () => {
    expect(() => {
      bleu.generateEgg('Test', 'unknown', {});
    }).toThrow('Unknown code type: unknown');
  });

  it('should handle edge cases in code quality validation', () => {
    const edgeCaseCode = `
      let x = 1;
      var y = 2;
      const z = x + y; // Mixed variable types
    `;
    expect(bleu.ensureCodeQuality(edgeCaseCode)).toBe(false);
  });

  it('should handle nested fields in egg generation', () => {
    const egg = bleu.generateEgg('Nested Test', 'model', {
      modelName: 'ComplexModel',
      fields: [
        { name: 'nestedField', type: 'object', fields: [{ name: 'subField', type: 'string' }] },
      ],
    });
    expect(egg.description).toBe(
      'Model ComplexModel with fields nestedField (object with fields subField)'
    );
  });
});
