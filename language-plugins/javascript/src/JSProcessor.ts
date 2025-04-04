import * as babel from '@babel/core';

class JSProcessor {
  private varToLetPlugin = () => {
    return {
      name: 'var-to-let',
      visitor: {
        VariableDeclaration(path: babel.NodePath<babel.types.VariableDeclaration>) {
          if (path.node.kind === 'var') {
            path.node.kind = 'let';
          }
        }
      }
    };
  };

  processCode(code: string): string {
    try {
      const result = babel.transformSync(code, {
        plugins: [this.varToLetPlugin],
        configFile: false,
        babelrc: false,
        retainLines: true,
        compact: false
      });

      if (!result?.code) {
        throw new Error('Failed to generate code');
      }

      return result.code.trim();
    } catch (error) {
      console.error('Error processing code:', error);
      throw new Error('Invalid code');
    }
  }
}

export default JSProcessor;
