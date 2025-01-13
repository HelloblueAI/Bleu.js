import { parse } from '@babel/parser';
import generate from '@babel/generator';
import JSProcessor from '../src/JSProcessor';

describe('JSProcessor', () => {
  it('should optimize code', () => {
    const processor = new JSProcessor();
    const code = 'var a = 1;';
    const ast = parse(code);
    const optimizedAst = processor.optimizeCode(ast);
    const optimizedCode = generate(optimizedAst).code;
    expect(optimizedCode).toBe('let a = 1;');
  });

  it('should process code', () => {
    const processor = new JSProcessor();
    const code = 'var a = 1;';
    const processedCode = processor.processCode(code);
    expect(processedCode).toBe('let a = 1;');
  });

  it('should throw an error for invalid code', () => {
    const processor = new JSProcessor();
    expect(() => processor.processCode('invalid code')).toThrow('Invalid code');
  });
});
