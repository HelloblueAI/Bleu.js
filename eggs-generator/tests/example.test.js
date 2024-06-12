const Bleu = require('../../core-engine/src/Bleu');

describe('Bleu', () => {
  let bleu;

  beforeAll(() => {
    bleu = new Bleu();
  });

  beforeEach(() => {
    bleu.eggs = []; 
  });

  it('should generate a new egg', () => {
    const egg = bleu.generateEgg('Test Egg', 'model', { modelName: 'TestModel', fields: [{ name: 'id', type: 'number' }, { name: 'name', type: 'string' }] });
    expect(egg).toHaveProperty('id');
    expect(egg).toHaveProperty('description', 'Model TestModel with fields id, name');
    expect(egg).toHaveProperty('type', 'model');
    expect(egg).toHaveProperty('code');
  });

  it('should optimize code', () => {
    const code = 'let  a  =  1 ;';
    const optimizedCode = bleu.optimizeCode(code);
    expect(optimizedCode).toBe('let a=1;');
  });

  it('should manage dependencies', () => {
    const dependencies = [{ name: 'express', version: '4.17.1' }, { name: 'lodash', version: '4.17.21' }];
    const spy = jest.spyOn(console, 'log');
    bleu.manageDependencies(dependencies);
    expect(spy).toHaveBeenCalledWith('Managing dependency: express@4.17.1');
    expect(spy).toHaveBeenCalledWith('Managing dependency: lodash@4.17.21');
    spy.mockRestore();
  });

  it('should ensure code quality', () => {
    const code = 'let a = 1;';
    const isQualityCode = bleu.ensureCodeQuality(code);
    expect(isQualityCode).toBe(true);
  });

  it('should generate multiple eggs', () => {
    const egg1 = bleu.generateEgg('Test Egg 1', 'model', { modelName: 'TestModel1', fields: [{ name: 'id', type: 'number' }] });
    const egg2 = bleu.generateEgg('Test Egg 2', 'utility', { utilityName: 'TestUtility', methods: ['method1', 'method2'] });
    expect(bleu.eggs).toHaveLength(2);
    expect(bleu.eggs[0]).toHaveProperty('description', 'Model TestModel1 with fields id');
    expect(bleu.eggs[1]).toHaveProperty('description', 'Utility TestUtility with methods method1, method2');
  });

  it('should handle large number of eggs', () => {
    for (let i = 0; i < 1000; i++) {
      bleu.generateEgg(`Egg ${i}`, 'model', { modelName: `Model${i}`, fields: [{ name: 'id', type: 'number' }] });
    }
    expect(bleu.eggs).toHaveLength(1000);
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

  it('should ensure quality of complex code', () => {
    const complexCode = `
      function test() {
        let a = 1;
        let b = 2;
        return a + b;
      }
    `;
    const isQualityCode = bleu.ensureCodeQuality(complexCode);
    expect(isQualityCode).toBe(true);
  });

  it('should debug code', () => {
    const code = 'console.log("Debug this code");';
    const spy = jest.spyOn(console, 'log');
    bleu.debugCode(code);
    expect(spy).toHaveBeenCalledWith(`Debugging code: ${code}`);
    spy.mockRestore();
  });

  it('should generate multiple eggs in bulk', () => {
    bleu.generateEggs(100, 'Bulk Egg', 'utility', { utilityName: 'BulkUtility', methods: ['bulkMethod'] });
    expect(bleu.eggs).toHaveLength(100);
  });

  it('should handle empty code optimization', () => {
    const code = '';
    const optimizedCode = bleu.optimizeCode(code);
    expect(optimizedCode).toBe('');
  });

  it('should manage empty dependencies', () => {
    const dependencies = [];
    const spy = jest.spyOn(console, 'log');
    bleu.manageDependencies(dependencies);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should ensure code quality for ES6 code', () => {
    const code = 'const a = 1;';
    const isQualityCode = bleu.ensureCodeQuality(code);
    expect(isQualityCode).toBe(true);
  });

  it('should ensure code quality for var usage', () => {
    const code = 'var a = 1;';
    const isQualityCode = bleu.ensureCodeQuality(code);
    expect(isQualityCode).toBe(false);
  });

  it('should generate a model egg with no fields', () => {
    const egg = bleu.generateEgg('Empty Model Egg', 'model', { modelName: 'EmptyModel', fields: [] });
    expect(egg).toHaveProperty('description', 'Model EmptyModel with fields ');
    expect(egg).toHaveProperty('type', 'model');
    expect(egg).toHaveProperty('code', 'class EmptyModel {\n  \n}');
  });

  it('should generate a utility egg with no methods', () => {
    const egg = bleu.generateEgg('Empty Utility Egg', 'utility', { utilityName: 'EmptyUtility', methods: [] });
    expect(egg).toHaveProperty('description', 'Utility EmptyUtility with methods ');
    expect(egg).toHaveProperty('type', 'utility');
    expect(egg).toHaveProperty('code', 'class EmptyUtility {\n  \n}');
  });

  it('should handle generating eggs with invalid type', () => {
    expect(() => {
      bleu.generateEgg('Invalid Egg', 'invalidType', {});
    }).toThrow('Unknown code type: invalidType');
  });

  it('should handle optimizing complex nested code', () => {
    const complexNestedCode = `
      function test() {
        let a = 1;
        if (a) {
          let b = 2;
          console.log(a + b);
        }
      }
    `;
    const optimizedCode = bleu.optimizeCode(complexNestedCode);
    expect(optimizedCode).toBe('function test(){let a=1;if(a){let b=2;console.log(a+b);}}');
  });

  it('should ensure quality of nested code', () => {
    const nestedCode = `
      function test() {
        let a = 1;
        if (a) {
          let b = 2;
          console.log(a + b);
        }
      }
    `;
    const isQualityCode = bleu.ensureCodeQuality(nestedCode);
    expect(isQualityCode).toBe(true);
  });

  it('should handle dependency with invalid version', () => {
    const dependencies = [{ name: 'express', version: 'invalid' }];
    const spy = jest.spyOn(console, 'log');
    bleu.manageDependencies(dependencies);
    expect(spy).toHaveBeenCalledWith('Managing dependency: express@invalid');
    spy.mockRestore();
  });

  it('should optimize and ensure quality of large code', () => {
    const largeCode = 'const a = 1;'.repeat(1000);
    const optimizedCode = bleu.optimizeCode(largeCode);
    const isQualityCode = bleu.ensureCodeQuality(optimizedCode);
    expect(isQualityCode).toBe(true);
  });

  it('should generate large number of eggs efficiently', () => {
    const start = Date.now();
    bleu.generateEggs(1000, 'Large Egg', 'model', { modelName: 'LargeModel', fields: [{ name: 'id', type: 'number' }] });
    const end = Date.now();
    expect(bleu.eggs).toHaveLength(1000);
    expect(end - start).toBeLessThan(5000); // Ensure the operation completes within 5 seconds
  });

  it('should handle empty generateEgg parameters', () => {
    expect(() => {
      bleu.generateEgg('', '', {});
    }).toThrow('Unknown code type: ');
  });
});