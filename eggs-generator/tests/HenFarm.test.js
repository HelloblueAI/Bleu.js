const HenFarm = require('../src/HenFarm.js');

describe('HenFarm', () => {
  let henFarm;

  beforeEach(() => {
    henFarm = new HenFarm();
  });

  it('should generate a model class with given options', () => {
    const options = {
      modelName: 'TestModel',
      fields: [
        { name: 'id', type: 'number' },
        { name: 'name', type: 'string' },
      ],
    };

    const code = henFarm.generateCode('model', options);

    expect(code).toContain('class TestModel');
    expect(code).toContain('id: number;');
    expect(code).toContain('name: string;');
  });

  it('should generate a utility class with given methods', () => {
    const options = {
      utilityName: 'TestUtility',
      methods: ['method1', 'method2'],
    };

    const code = henFarm.generateCode('utility', options);

    expect(code).toContain('class TestUtility');
    expect(code).toContain('method1() {');
    expect(code).toContain('method2() {');
  });

  it('should throw an error for unknown code type', () => {
    const options = { name: 'Unknown' };

    expect(() => henFarm.generateCode('unknown', options)).toThrow(
      'Unknown code type: unknown',
    );
  });
});
