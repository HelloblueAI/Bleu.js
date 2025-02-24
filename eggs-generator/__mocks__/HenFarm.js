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

class HenFarm {
  /**
   * Generate different types of code structures dynamically.
   * @param {string} type - Type of code to generate ('model', 'utility', 'controller', 'service').
   * @param {Object} options - Configuration options for the code generation.
   * @returns {string} - Generated code as a string.
   */
  generateCode(type, options) {
    if (!type || typeof type !== 'string') {
      throw new Error('Type must be a valid string.');
    }

    if (!options || typeof options !== 'object') {
      throw new Error(
        'Options must be an object with necessary configuration details.',
      );
    }

    switch (type.toLowerCase()) {
      case 'model':
        return this.generateModel(options);
      case 'utility':
        return this.generateUtility(options);
      case 'controller':
        return this.generateController(options);
      case 'service':
        return this.generateService(options);
      default:
        throw new Error(`Unknown code type: ${type}`);
    }
  }

  /**
   * Generate a class-based Model definition.
   * @param {Object} options - { modelName: string, fields: Array<{ name: string, type: string }> }
   * @returns {string}
   */
  generateModel(options) {
    if (!options.modelName || !Array.isArray(options.fields)) {
      throw new Error(
        'Model generation requires a modelName and an array of fields.',
      );
    }

    return `
class ${options.modelName} {
  constructor({ ${options.fields.map((field) => field.name).join(', ')} }) {
    ${options.fields.map((field) => `this.${field.name} = ${field.name};`).join('\n    ')}
  }

  toJSON() {
    return {
      ${options.fields.map((field) => `${field.name}: this.${field.name}`).join(',\n      ')}
    };
  }
}
`;
  }

  /**
   * Generate a class-based Utility function definition.
   * @param {Object} options - { utilityName: string, methods: Array<string> }
   * @returns {string}
   */
  generateUtility(options) {
    if (!options.utilityName || !Array.isArray(options.methods)) {
      throw new Error(
        'Utility generation requires a utilityName and an array of method names.',
      );
    }

    return `
class ${options.utilityName} {
  ${options.methods
    .map(
      (method) => `
  static ${method}() {
    // TODO: Implement ${method}
    throw new Error('${method} is not implemented yet.');
  }
  `,
    )
    .join('\n  ')}
}
`;
  }

  /**
   * Generate a class-based Controller definition.
   * @param {Object} options - { controllerName: string, routes: Array<string> }
   * @returns {string}
   */
  generateController(options) {
    if (!options.controllerName || !Array.isArray(options.routes)) {
      throw new Error(
        'Controller generation requires a controllerName and an array of routes.',
      );
    }

    return `
class ${options.controllerName} {
  constructor() {}

  ${options.routes
    .map(
      (route) => `
  async ${route}(req, res) {
    try {
      // TODO: Implement ${route} logic
      res.status(200).json({ message: '${route} endpoint hit' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  `,
    )
    .join('\n  ')}
}
export default new ${options.controllerName}();
`;
  }

  /**
   * Generate a class-based Service definition.
   * @param {Object} options - { serviceName: string, methods: Array<string> }
   * @returns {string}
   */
  generateService(options) {
    if (!options.serviceName || !Array.isArray(options.methods)) {
      throw new Error(
        'Service generation requires a serviceName and an array of method names.',
      );
    }

    return `
class ${options.serviceName} {
  constructor() {}

  ${options.methods
    .map(
      (method) => `
  async ${method}() {
    // TODO: Implement ${method} service logic
    throw new Error('${method} is not implemented yet.');
  }
  `,
    )
    .join('\n  ')}
}
export default new ${options.serviceName}();
`;
  }
}

export default HenFarm;
