import { Engine } from 'json-rules-engine';
import logger from '../utils/logger.mjs';

class RulesEngine {
  constructor() {
    this.engine = new Engine();
    this.rules = [];
    this.logger = logger;
    this.initializeRules();
  }

  /**
   * Initializes the rules engine with predefined rules.
   */
  initializeRules() {
    const predefinedRules = [
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
          params: { message: '⚠️ High temperature detected' },
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
          params: { message: '🔥 Extremely high temperature detected' },
        },
      },
    ];

    predefinedRules.forEach((rule) => {
      this.engine.addRule(rule);
      this.rules.push(rule);
    });

    this.logger.info(`✅ Initialized ${this.rules.length} rules.`);
  }

  /**
   * Evaluates given input data against defined rules.
   * @param {Object} data - Input data containing facts.
   * @returns {Promise<Array>} - Matched events with messages.
   */
  async evaluate(data) {
    try {
      this.logger.info(`🔍 Evaluating rules for data: ${JSON.stringify(data)}`);
      const results = await this.engine.run(data);

      if (results.events.length > 0) {
        this.logger.info(
          `✅ ${results.events.length} rule(s) matched: ${results.events
            .map((event) => event.type)
            .join(', ')}`,
        );
      } else {
        this.logger.info('ℹ️ No matching rules found.');
      }

      return results.events.map((event) => event.params);
    } catch (error) {
      this.logger.error(`❌ Error evaluating rules: ${error.message}`);
      throw error;
    }
  }
}

export default RulesEngine;
