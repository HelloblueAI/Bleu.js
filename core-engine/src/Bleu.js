const HenFarm = require('../../eggs-generator/src/HenFarm');

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
      code
    };
    this.eggs.push(newEgg);
    return newEgg;
  }

  generateCode(type, options) {
    return this.henFarm.generateCode(type, options);
  }

  generateDescription(type, options) {
    switch (type) {
      case 'model':
        return `Model ${options.modelName} with fields ${options.fields.map(f => f.name).join(', ')}`;
      case 'utility':
        return `Utility ${options.utilityName} with methods ${options.methods.join(', ')}`;
      default:
        throw new Error(`Unknown code type: ${type}`);
    }
  }

  optimizeCode(code) {
    return code.replace(/\s+/g, ' ').trim();
  }

  manageDependencies(dependencies) {
    dependencies.forEach(dep => {
      console.log(`Managing dependency: ${dep.name}@${dep.version}`);
    });
  }

  ensureCodeQuality(code) {
    return !code.includes('var');
  }

  debugCode(code) {
    console.log(`Debugging code: ${code}`);
  }

  generateEggs(count, description, type, options) {
    for (let i = 0; i < count; i++) {
      this.generateEgg(`${description} ${i + 1}`, type, options);
    }
  }
}

module.exports = Bleu;