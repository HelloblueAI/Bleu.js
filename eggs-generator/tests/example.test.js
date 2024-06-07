const Bleu = require('../src/index');

describe('Bleu', () => {
  let bleu;

  beforeEach(() => {
    bleu = new Bleu();
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
    expect(optimizedCode).toBe('let a = 1;');
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
    expect(optimizedCode).toBe('function test() { let a = 1; let b = 2; return a + b; }');
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
});
