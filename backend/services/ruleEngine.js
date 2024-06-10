const { Engine } = require('json-rules-engine');
const Logger = require('../utils/logger'); // Import the logger

class RulesEngine {
  constructor() {
    this.engine = new Engine();
    this.logger = new Logger();
  }

  // Add a rule to the engine
  addRule(rule) {
    try {
      this.engine.addRule(rule);
      this.logger.info(`Rule added: ${rule.name || 'Unnamed rule'}`, rule);
    } catch (error) {
      this.logger.error('Error adding rule:', error);
      throw error;
    }
  }

  // Remove a rule from the engine
  removeRule(rule) {
    try {
      // Assuming we have a way to remove a rule by name or id
      this.engine.removeRule(rule);
      this.logger.info(`Rule removed: ${rule.name || 'Unnamed rule'}`);
    } catch (error) {
      this.logger.error('Error removing rule:', error);
      throw error;
    }
  }

  // Update an existing rule
  updateRule(rule) {
    try {
      this.removeRule(rule);
      this.addRule(rule);
      this.logger.info(`Rule updated: ${rule.name || 'Unnamed rule'}`, rule);
    } catch (error) {
      this.logger.error('Error updating rule:', error);
      throw error;
    }
  }

  // Evaluate the data against the rules
  async evaluate(data) {
    try {
      const results = await this.engine.run(data);
      this.logger.info('Rules evaluated:', results.events);
      return results.events.map(event => event.params.message);
    } catch (error) {
      this.logger.error('Error evaluating rules:', error);
      throw error;
    }
  }

  // Add complex conditions and actions
  addComplexRule(name, conditions, actions, priority = 1) {
    const rule = {
      name,
      conditions: {
        all: conditions,
      },
      event: {
        type: 'ruleTriggered',
        params: {
          message: actions,
        },
      },
      priority,
    };
    this.addRule(rule);
  }

  // Advanced error handling and reporting
  handleError(error) {
    this.logger.error('Rule engine error:', error);
    // Further error handling logic (e.g., notify admin, retry mechanism)
  }
}

module.exports = RulesEngine;
