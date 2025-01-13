import { parse } from '@babel/core';
import { default as generate } from '@babel/generator';
import { default as traverse } from '@babel/traverse';

class JSProcessor {
  constructor() {
    this.babelOptions = {
      presets: ['@babel/preset-env'],
      plugins: ['@babel/plugin-transform-runtime'],
    };
  }

  parseCode(code) {
    try {
      return parse(code, { sourceType: 'module' });
    } catch (error) {
      throw new Error(`Error parsing code: ${error.message}`);
    }
  }

  optimizeCode(ast) {
    try {
      traverse(ast, {
        enter(path) {
          if (path.isIdentifier({ name: 'var' })) {
            path.node.name = 'let';
          }
        },
      });
      return ast;
    } catch (error) {
      throw new Error(`Error optimizing code: ${error.message}`);
    }
  }

  generateCode(ast) {
    try {
      return generate(ast, {}, '').code;
    } catch (error) {
      throw new Error(`Error generating code: ${error.message}`);
    }
  }

  processCode(code) {
    const ast = this.parseCode(code);
    const optimizedAst = this.optimizeCode(ast);
    return this.generateCode(optimizedAst);
  }
}

export default JSProcessor;
