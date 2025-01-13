import generate from '@babel/generator';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

class JSProcessor {
  optimizeCode(ast) {
    traverse(ast, {
      VariableDeclaration(path) {
        if (path.node.kind === 'var') {
          path.node.kind = 'let';
        }
      },
    });
    return ast;
  }

  processCode(code) {
    try {
      const ast = parse(code);
      const optimizedAst = this.optimizeCode(ast);
      return generate(optimizedAst).code;
    } catch (error) {
      throw new Error('Invalid code');
    }
  }
}

export default JSProcessor;
