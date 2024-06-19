const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

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
      const ast = parser.parse(code);
      const optimizedAst = this.optimizeCode(ast);
      return generate(optimizedAst).code;
    } catch (error) {
      throw new Error('Invalid code');
    }
  }
}

module.exports = JSProcessor;
