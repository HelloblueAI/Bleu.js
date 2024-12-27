const parser = require('@babel/parser');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

class JSProcessor {
  /**
   * Optimizes the Abstract Syntax Tree (AST) by applying transformations.
   *
   * @param {Object} ast - The Abstract Syntax Tree of the JavaScript code.
   * @returns {Object} - Optimized Abstract Syntax Tree.
   */
  optimizeCode(ast) {
    traverse(ast, {
      VariableDeclaration(path) {
        if (path.node.kind === 'var') {
          path.node.kind = 'let'; // Replace `var` with `let`
        }
      },
    });
    return ast;
  }

  /**
   * Processes JavaScript code by parsing it, optimizing the AST, and generating code.
   *
   * @param {string} code - JavaScript code as a string.
   * @returns {string} - Processed JavaScript code.
   * @throws {Error} - If the input code is invalid.
   */
  processCode(code) {
    try {
      const ast = parser.parse(code, { sourceType: 'module' });
      const optimizedAst = this.optimizeCode(ast);
      const { code: optimizedCode } = generate(optimizedAst);
      return optimizedCode;
    } catch (error) {
      throw new Error('Invalid code');
    }
  }
}

module.exports = JSProcessor;
