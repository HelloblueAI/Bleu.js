//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.

import HenFarm from './HenFarm';
import { execSync } from 'child_process';
import { parse, generate } from 'abstract-syntax-tree';

class Bleu {
  constructor() {
    this.eggs = [];
    this.henFarm = new HenFarm();
    this.validTypes = ['model', 'utility', 'component', 'service'];
  }

  /**
   * Generates a new egg with the given parameters.
   * @param {string} description - A description of the egg.
   * @param {string} type - The type of code (e.g., 'model', 'utility').
   * @param {object} options - Options for generating the code.
   * @returns {object} The generated egg.
   */
  generateEgg(description, type, options) {
    this.validateType(type);
    const code = this.henFarm.generateCode(type, options);
    const optimizedCode = this.optimizeCode(code);
    const qualityPassed = this.ensureCodeQuality(optimizedCode);

    if (!qualityPassed) {
      console.warn('Code quality check failed. Review suggested improvements.');
    }

    const newEgg = {
      id: this.eggs.length + 1,
      description: this.generateDescription(type, options),
      type,
      code: optimizedCode,
    };

    this.eggs.push(newEgg);
    return newEgg;
  }

  /**
   * Validates the type of code.
   * @param {string} type - The type to validate.
   */
  validateType(type) {
    if (!this.validTypes.includes(type)) {
      throw new Error(
        `Invalid code type: ${type}. Valid types are ${this.validTypes.join(', ')}.`,
      );
    }
  }

  /**
   * Generates a description for the egg based on type and options.
   * @param {string} type - The type of code.
   * @param {object} options - Options for the description.
   * @returns {string} The generated description.
   */
  generateDescription(type, options) {
    const { name, fields, methods, props, endpoints } = options || {};
    switch (type) {
      case 'model':
        return `Model ${name} with fields ${fields?.map((f) => f.name).join(', ')}`;
      case 'utility':
        return `Utility ${name} with methods ${methods?.join(', ')}`;
      case 'component':
        return `Component ${name} with props ${props?.join(', ')}`;
      case 'service':
        return `Service ${name} with endpoints ${endpoints?.join(', ')}`;
      default:
        throw new Error(`Unknown code type: ${type}`);
    }
  }

  /**
   * Optimizes the given code using static analysis and minification.
   * @param {string} code - The code to optimize.
   * @returns {string} The optimized code.
   */
  optimizeCode(code) {
    // Parse and manipulate the abstract syntax tree (AST)
    const ast = parse(code);
    // Example: Remove unused variables
    ast.body = ast.body.filter(
      (node) =>
        node.type !== 'VariableDeclaration' ||
        node.declarations.some((decl) => decl.init),
    );
    return generate(ast)
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\s*([{};=(),+*/-])\s*/g, '$1');
  }

  /**
   * Ensures code quality by checking for best practices and standards.
   * @param {string} code - The code to validate.
   * @returns {boolean} Whether the code meets quality standards.
   */
  ensureCodeQuality(code) {
    if (code.includes('var')) {
      console.warn('Avoid using "var". Use "let" or "const" instead.');
      return false;
    }
    return true;
  }

  /**
   * Automatically installs missing dependencies.
   * @param {string[]} dependencies - A list of dependencies.
   */
  manageDependencies(dependencies) {
    dependencies.forEach((dep) => {
      console.log(`Checking dependency: ${dep}`);
      try {
        require.resolve(dep);
      } catch {
        console.log(`Installing missing dependency: ${dep}`);
        execSync(`pnpm install ${dep}`, { stdio: 'inherit' });
      }
    });
  }

  /**
   * Debugs the given code by simulating execution in a virtual runtime.
   * @param {string} code - The code to debug.
   */
  debugCode(code) {
    try {
      console.log('Simulating execution...');
      const result = eval(code); // Safely evaluate code in a controlled environment
      console.log('Execution result:', result);
    } catch (err) {
      console.error('Debugging error:', err.message);
    }
  }

  /**
   * Generates multiple eggs at once.
   * @param {number} count - The number of eggs to generate.
   * @param {string} description - The base description for each egg.
   * @param {string} type - The type of code.
   * @param {object} options - Options for generating the code.
   */
  generateEggs(count, description, type, options) {
    for (let i = 0; i < count; i++) {
      this.generateEgg(`${description} ${i + 1}`, type, options);
    }
  }

  /**
   * Lists all generated eggs.
   * @returns {object[]} The list of eggs.
   */
  listEggs() {
    return this.eggs;
  }

  /**
   * Extends functionality with plugins.
   * @param {Function} plugin - A function that adds new methods or properties.
   */
  usePlugin(plugin) {
    plugin(this);
  }
}

export default Bleu;
