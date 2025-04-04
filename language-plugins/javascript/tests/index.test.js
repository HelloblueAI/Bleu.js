import JSProcessor from '../src/JSProcessor';

describe('JSProcessor', () => {
  it('should optimize code', () => {
    const processor = new JSProcessor();
    const code = 'var a = 1;';
    const optimizedCode = processor.processCode(code);
    expect(optimizedCode.trim()).toBe('let a = 1;');
  });

  it('should process code', () => {
    const processor = new JSProcessor();
    const code = 'const x = 42;';
    const result = processor.processCode(code);
    expect(result.trim()).toBe('const x = 42;');
  });

  it('should throw an error for invalid code', () => {
    const processor = new JSProcessor();
    expect(() => {
      processor.processCode('invalid { code');
    }).toThrow('Invalid code');
  });
});
