class RulesEngine {
    constructor() {
      this.rules = [];
    }
  
    addRule(rule) {
      this.rules.push(rule);
    }
  
    evaluate(data) {
      const results = [];
      for (const rule of this.rules) {
        if (rule.condition(data)) {
          results.push(rule.action(data));
        }
      }
      return results.length ? results : ['No matching rule found'];
    }
  
    static and(...conditions) {
      return (data) => conditions.every(condition => condition(data));
    }
  
    static or(...conditions) {
      return (data) => conditions.some(condition => condition(data));
    }
  
    static not(condition) {
      return (data) => !condition(data);
    }
  }
  
  module.exports = RulesEngine;
  