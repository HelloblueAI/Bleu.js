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

'use strict';

/* eslint-env node */
const { Engine } = require('json-rules-engine');
const logger = require('../src/utils/logger');

class RulesEngine {
  constructor() {
    this.engine = new Engine();
    this.rules = [];
    this.addDefaultRules();
  }

  /**
   * Adds default rules to the engine.
   */
  addDefaultRules() {
    logger.info('🔧 Adding default rules to the RulesEngine');

    const defaultRules = [
      {
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
          params: {
            message: 'High temperature detected',
          },
        },
      },
      {
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
          params: {
            message: 'Extremely high temperature detected',
          },
        },
      },
    ];

    this.addRules(defaultRules);
  }

  /**
   * Adds new rules dynamically.
   * @param {Array} newRules - Array of rule objects to be added.
   */
  addRules(newRules) {
    try {
      newRules.forEach((rule) => {
        this.engine.addRule(rule);
        this.rules.push(rule);
      });
      logger.info(`✅ Added ${newRules.length} new rules.`);
    } catch (error) {
      logger.error('❌ Error adding rules:', error);
      throw error;
    }
  }

  /**
   * Evaluates the given data against the rule engine.
   * @param {Object} data - Input facts for rule evaluation.
   * @returns {Promise<Array>} List of triggered rule events.
   */
  async evaluate(data) {
    try {
      logger.info('🔍 Evaluating rules with given data');
      const results = await this.engine.run(data);
      const triggeredEvents = results.events.map((event) => event.params);

      if (triggeredEvents.length > 0) {
        logger.info(`🚀 Rules triggered: ${triggeredEvents.length}`);
      } else {
        logger.info('ℹ️ No rules triggered.');
      }

      return triggeredEvents;
    } catch (error) {
      logger.error('❌ Error evaluating rules:', error);
      throw error;
    }
  }

  /**
   * Gets the list of currently added rules.
   * @returns {Array} List of rules.
   */
  getRules() {
    return this.rules;
  }
}

module.exports = RulesEngine;
