const { Engine, Rule } = require('json-rules-engine');
const Logger = require('../src/utils/logger');

class RulesEngine {
  constructor() {
    this.engine = new Engine();
    this.rules = [];
    this.logger = new Logger();
  }

  addRule(ruleData) {
    try {
      const rule = new Rule(ruleData);
      this.engine.addRule(rule);
      this.rules.push(rule);
      this.logger.info(`Rule added: ${rule.name || 'Unnamed Rule'}`);
    } catch (error) {
      this.logger.error('Error adding rule:', error);
      throw error;
    }
  }

  removeRule(ruleName) {
    try {
      const index = this.rules.findIndex(rule => rule.name === ruleName);
      if (index !== -1) {
        const [rule] = this.rules.splice(index, 1);
        this.engine.removeRule(rule);
        this.logger.info(`Rule removed: ${ruleName}`);
      } else {
        this.logger.warn(`Rule not found: ${ruleName}`);
      }
    } catch (error) {
      this.logger.error('Error removing rule:', error);
      throw error;
    }
  }

  updateRule(ruleName, updatedRuleData) {
    try {
      const index = this.rules.findIndex(rule => rule.name === ruleName);
      if (index !== -1) {
        const rule = new Rule(updatedRuleData);
        this.rules[index] = rule;
        this.engine.removeRule(this.rules[index]);
        this.engine.addRule(rule);
        this.logger.info(`Rule updated: ${ruleName}`);
      } else {
        this.logger.warn(`Rule not found: ${ruleName}`);
      }
    } catch (error) {
      this.logger.error('Error updating rule:', error);
      throw error;
    }
  }

  async evaluate(data) {
    try {
      const results = await this.engine.run(data);
      this.logger.info('Rules evaluated', { results });
      return results.events.map(event => event.params);
    } catch (error) {
      this.logger.error('Error evaluating rules:', error);
      throw error;
    }
  }
}

module.exports = RulesEngine;
