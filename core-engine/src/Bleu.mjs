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
import HenFarm from '../../eggs-generator/src/HenFarm';

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
        return `Model ${options.modelName} with fields ${options.fields.map((f) => f.name).join(', ')}`;
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
    dependencies.forEach((dep) => {
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

export default Bleu;
