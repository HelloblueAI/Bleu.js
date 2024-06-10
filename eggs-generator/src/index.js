const HenFarm = require('./HenFarm'); 

class Bleu {
  constructor() {
    this.eggs = [];
    this.henFarm = new HenFarm(); 
  }

  generateDescription(type, options) {
    switch (type) {
      case 'model':
        return `Model ${options.modelName} with fields ${options.fields.map(field => field.name).join(', ')}`;
      case 'utility':
        return `Utility ${options.utilityName} with methods ${options.methods.join(', ')}`;
      case 'service':
        return `Service ${options.serviceName} with endpoints ${options.endpoints.map(endpoint => endpoint.name).join(', ')}`;
      default:
        throw new Error(`Unknown code type: ${type}`);
    }
  }

  generateEgg(description, type, options) {
    const code = this.henFarm.generateCode(type, options); // Use HenFarm.js to generate code
    const newEgg = {
      id: this.eggs.length + 1,
      description: this.generateDescription(type, options),
      type,
      code,
      createdAt: new Date()
    };
    this.eggs.push(newEgg);
    return newEgg;
  }

  optimizeCode(code) {
    // Remove extra spaces and trim the code
    const optimizedCode = code.replace(/\s+/g, ' ').trim().replace(/ ;/g, ';');
    return optimizedCode;
  }

  manageDependencies(dependencies) {
    dependencies.forEach(dep => {
      console.log(`Managing dependency: ${dep}`);
      // Simulate installation
      // In a real scenario, you might use child_process to run npm or yarn commands
    });
  }

  ensureCodeQuality(code) {
    // Basic code quality check
    return !code.includes('var'); // Simplistic quality check
  }
}

module.exports = Bleu;
