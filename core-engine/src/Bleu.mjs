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

import HenFarm from '../../eggs-generator/src/HenFarm.mjs';
import prettier from 'prettier';
import { ESLint } from 'eslint';
import { logger } from '../config/logger.mjs';
import { EggModel } from '../database/eggSchema.mjs';
import { execSync } from 'child_process';

class Bleu {
  constructor() {
    this.eggs = [];
    this.henFarm = new HenFarm();
  }

  /**
   * 🚀 Generate an "egg" (code snippet) with validation and optimization.
   */
  async generateEgg(description, type, options) {
    try {
      const code = await this.generateCode(type, options);
      const formattedCode = await this.optimizeCode(code);
      const isValid = await this.ensureCodeQuality(formattedCode);

      if (!isValid) throw new Error('Generated code failed ESLint validation.');

      const newEgg = {
        id: this.eggs.length + 1,
        description: this.generateDescription(type, options),
        type,
        code: formattedCode,
        createdAt: new Date(),
      };

      this.eggs.push(newEgg);
      await this.saveEgg(newEgg); // Save to MongoDB

      return newEgg;
    } catch (error) {
      logger.error('❌ Error generating egg:', { error });
      throw error;
    }
  }

  /**
   * 🏗️ Generate code using HenFarm
   */
  async generateCode(type, options) {
    try {
      return this.henFarm.generateCode(type, options);
    } catch (error) {
      logger.error(`❌ Error generating code for type "${type}":`, error);
      throw error;
    }
  }

  /**
   * 📝 Generate human-readable descriptions for the generated code
   */
  generateDescription(type, options) {
    try {
      switch (type) {
        case 'model':
          return `Model ${options.modelName} with fields ${options.fields.map((f) => f.name).join(', ')}`;
        case 'utility':
          return `Utility ${options.utilityName} with methods ${options.methods.join(', ')}`;
        default:
          throw new Error(`Unknown code type: ${type}`);
      }
    } catch (error) {
      logger.warn(
        `⚠️ Failed to generate description for type "${type}"`,
        error,
      );
      return 'Unknown Egg Type';
    }
  }

  /**
   * 🎨 Optimize code formatting using Prettier
   */
  async optimizeCode(code) {
    try {
      return prettier.format(code, { parser: 'babel' });
    } catch (error) {
      logger.warn('⚠️ Prettier formatting failed, returning raw code.');
      return code;
    }
  }

  /**
   * ✅ Ensure code quality using ESLint
   */
  async ensureCodeQuality(code) {
    try {
      const eslint = new ESLint();
      const results = await eslint.lintText(code);
      return results.every((r) => r.errorCount === 0);
    } catch (error) {
      logger.warn('⚠️ ESLint validation failed:', error);
      return false;
    }
  }

  /**
   * 📦 Manage dependencies safely
   */
  manageDependencies(dependencies) {
    try {
      dependencies.forEach((dep) => {
        if (
          !/^[a-zA-Z0-9@._-]+$/.test(dep.name) ||
          !/^[a-zA-Z0-9@._-]+$/.test(dep.version)
        ) {
          throw new Error(
            `Invalid dependency name or version: ${dep.name}@${dep.version}`,
          );
        }
        logger.info(`📦 Checking dependency: ${dep.name}@${dep.version}`);
        execSync(`pnpm add ${dep.name}@${dep.version}`, {
          stdio: 'inherit',
          shell: true,
        });
      });
    } catch (error) {
      logger.error('❌ Dependency management failed:', error);
    }
  }

  /**
   * 🔎 Intelligent Debugging
   */
  debugCode(code) {
    logger.debug('🛠 Debugging Code:', { code });
  }

  /**
   * 🏗️ Generate multiple eggs efficiently
   */
  async generateEggs(count, description, type, options) {
    const eggs = [];
    for (let i = 0; i < count; i++) {
      const egg = await this.generateEgg(
        `${description} ${i + 1}`,
        type,
        options,
      );
      eggs.push(egg);
    }
    return eggs;
  }

  /**
   * 📌 Save generated egg to MongoDB
   */
  async saveEgg(newEgg) {
    try {
      const egg = new EggModel(newEgg);
      await egg.save();
      logger.info(`✅ Egg ${newEgg.id} saved successfully.`);
    } catch (error) {
      logger.error('❌ Error saving egg to MongoDB:', error);
    }
  }
}

export default Bleu;
