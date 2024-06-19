const HenFarm = require('./HenFarm');

class Bleu {
  constructor() {
    this.eggs = [];
    this.henFarm = new HenFarm();
  }

  generateEgg(description, type, options) {
    const code = this.henFarm.generateCode(type, options);
    const newEgg = {
      id: this.eggs.length + 1,
      description: this.generateDescription(type, options),
      type,
      code,
      createdAt: new Date(),
    };
    this.eggs.push(newEgg);
    return newEgg;
  }

  generateCode(type, options) {
    switch (type) {
      case 'model':
        return this.generateModel(options.modelName, options.fields);
      case 'utility':
        return this.generateUtility(options.utilityName, options.methods);
      default:
        throw new Error(`Unknown code type: ${type}`);
    }
  }

  generateModel(modelName, fields) {
    let code = `class ${modelName} {\n`;
    fields.forEach((field) => {
      code += `  ${field.name}: ${field.type};\n`;
    });
    code += '}';
    return code;
  }

  generateUtility(utilityName, methods) {
    let code = `class ${utilityName} {\n`;
    methods.forEach((method) => {
      code += `  ${method}() {\n`;
      code += `    // TODO: Implement ${method}\n`;
      code += '  }\n';
    });
    code += '}';
    return code;
  }

  generateDescription(type, options) {
    switch (type) {
      case 'model':
        return `Model ${options.modelName} with fields ${options.fields.map((f) => f.name).join(', ')}`;
      case 'utility':
        return `Utility ${options.utilityName} with methods ${options.methods.join(', ')}`;
      default:
        throw new Error(`Unknown code type: ${type}`);
    }
  }

  optimizeCode(code) {
    return code
      .replace(/\s+/g, ' ')
      .replace(/\s*([{};=,+*/()-])\s*/g, '$1')
      .trim();
  }

  manageDependencies(dependencies) {
    dependencies.forEach((dep) => {
      console.log(`Managing dependency: ${dep}`);
    });
  }

  ensureCodeQuality(code) {
    return !code.includes('var');
  }
}

module.exports = Bleu;
