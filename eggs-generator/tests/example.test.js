const Bleu = require('../src/Bleu');

describe('Bleu', () => {
  let bleu;

  beforeEach(() => {
    bleu = new Bleu();
  });

  it('should generate a new egg', () => {
    const egg = bleu.generateEgg('Test description', 'model', { modelName: 'TestModel', fields: [{ name: 'field1', type: 'string' }] });
    expect(egg).toHaveProperty('id');
    expect(egg).toHaveProperty('description');
    expect(egg).toHaveProperty('type', 'model');
    expect(egg).toHaveProperty('code');
    expect(egg).toHaveProperty('createdAt');
  });

  it('should optimize code', () => {
    const code = 'let  a  =  1 ;';
    const optimizedCode = bleu.optimizeCode(code);
    expect(optimizedCode).toBe('let a=1;');
  });

  it('should manage dependencies', () => {
    const dependencies = ['express', 'lodash'];
    bleu.manageDependencies(dependencies);
  });

  it('should ensure code quality', () => {
    const code = 'const a = 1;';
    const isQualityCode = bleu.ensureCodeQuality(code);
    expect(isQualityCode).toBe(true);
  });

  it('should generate multiple eggs', () => {
    const egg1 = bleu.generateEgg('Test description 1', 'model', { modelName: 'TestModel1', fields: [{ name: 'field1', type: 'string' }] });
    const egg2 = bleu.generateEgg('Test description 2', 'utility', { utilityName: 'TestUtility', methods: ['method1'] });
    expect(bleu.eggs).toHaveLength(2);
  });

  it('should handle large number of eggs', () => {
    for (let i = 0; i < 1000; i++) {
      bleu.generateEgg(`Test description ${i}`, 'model', { modelName: `TestModel${i}`, fields: [{ name: 'field1', type: 'string' }] });
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
        if (a) {
          let b = 2;
          console.log(a + b);
        }
      }
    `;
    const isQualityCode = bleu.ensureCodeQuality(complexCode);
    expect(isQualityCode).toBe(true);
  });
});
