class HenFarm {
    generateCode(type, options) {
      // Mock implementation of generateCode method
      switch (type) {
        case 'model':
          return `class ${options.modelName} {\n  ${options.fields.map(field => `${field.name}: ${field.type};`).join('\n  ')}\n}`;
        case 'utility':
          return `class ${options.utilityName} {\n  ${options.methods.map(method => `${method}() {\n    // TODO: Implement ${method}\n  }`).join('\n  ')}\n}`;
        default:
          throw new Error(`Unknown code type: ${type}`);
      }
    }
  }
  
  module.exports = HenFarm;
  