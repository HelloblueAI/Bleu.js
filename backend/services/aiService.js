const RulesEngine = require('../ai/rulesEngine');

class AIService {
  constructor() {
    this.engine = new RulesEngine();
  }

  addRule(rule) {
    this.engine.addRule(rule);
  }

  evaluate(data) {
    const startTime = Date.now();
    const result = this.engine.evaluate(data);
    const endTime = Date.now();
    console.log(`AI evaluation took ${endTime - startTime}ms`);
    return result;
  }
}

module.exports = AIService;
