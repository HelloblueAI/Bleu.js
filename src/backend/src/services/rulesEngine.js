
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
/* eslint-env node */
import { Engine } from 'json-rules-engine';

import logger from '../src/utils/logger';

class RulesEngine {
  constructor() {
    this.engine = new Engine();
    this.rules = [];
    this.logger = logger;
    this.addRules();
  }

  addRules() {
    this.rules.push({
      conditions: {
        any: [
          {
            fact: 'temperature',
            operator: 'greaterThanInclusive',
            value: 100,
          },
        ],
      },
      event: {
        type: 'High temperature detected',
        params: { message: 'High temperature detected' },
      },
    });

    this.rules.push({
      conditions: {
        any: [
          {
            fact: 'temperature',
            operator: 'greaterThanInclusive',
            value: 120,
          },
        ],
      },
      event: {
        type: 'Extremely high temperature detected',
        params: { message: 'Extremely high temperature detected' },
      },
    });

    this.rules.forEach((rule) => this.engine.addRule(rule));
  }

  async evaluate(data) {
    try {
      const results = await this.engine.run(data);
      return results.events.map((event) => event.params);
    } catch (error) {
      this.logger.error('Error evaluating rules:', error);
      throw error;
    }
  }
}

export default RulesEngine;
