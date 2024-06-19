const { Engine } = require('json-rules-engine');
const logger = require('../src/utils/logger');

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
    const results = await this.engine.run(data);
    return results.events.map((event) => event.params);
  }
}

module.exports = RulesEngine;
