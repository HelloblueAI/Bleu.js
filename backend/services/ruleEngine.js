const { Engine } = require('json-rules-engine');
const Logger = require('../utils/logger'); 

class RulesEngine {
  constructor() {
    this.engine = new Engine();
    this.logger = new Logger();
  }


  addRule(rule) {
    try {
      this.engine.addRule(rule);
      this.logger.info(`Rule added: ${rule.name || 'Unnamed rule'}`, rule);
    } catch (error) {
      this.logger.error('Error adding rule:', error);
      throw error;
    }
  }

 
  removeRule(rule) {
    try {

      this.engine.removeRule(rule);
      this.logger.info(`Rule removed: ${rule.name || 'Unnamed rule'}`);
    } catch (error) {
      this.logger.error('Error removing rule:', error);
      throw error;
    }
  }


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


  handleError(error) {
    this.logger.error('Rule engine error:', error);
    
  }
}

module.exports = RulesEngine;
