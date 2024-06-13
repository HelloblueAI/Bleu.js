import NLPProcessor from '../ai/nlpProcessor.js';
import RulesEngine from './rulesEngine.js';
import DecisionTree from '../ai/decisionTree.js';
import Rule from '../models/ruleModel.js';
import Logger from '../utils/logger.js';

const sampleTree = {
  isLeaf: false,
  condition: (data) => data.someCondition,
  trueBranch: {
    isLeaf: true,
    result: 'True Branch Result'
  },
  falseBranch: {
    isLeaf: true,
    result: 'False Branch Result'
  }
};

class AIService {
  constructor() {
    this.rulesEngine = new RulesEngine();
    this.decisionTree = new DecisionTree(sampleTree);
    this.logger = new Logger();
  }

  async addRule(ruleData) {
    try {
      const rule = new Rule(ruleData);
      await rule.save();
      this.rulesEngine.addRule(rule);
      this.logger.info(`Rule added: ${rule.name}`);
    } catch (error) {
      this.logger.error('Error adding rule:', error);
      throw error;
    }
  }

  async removeRule(ruleId) {
    try {
      const rule = await Rule.findByIdAndDelete(ruleId);
      if (rule) {
        this.rulesEngine.removeRule(rule.name);
        this.logger.info(`Rule removed: ${rule.name}`);
      } else {
        this.logger.warn(`Rule not found: ${ruleId}`);
      }
    } catch (error) {
      this.logger.error('Error removing rule:', error);
      throw error;
    }
  }

  async updateRule(ruleId, updates) {
    try {
      const rule = await Rule.findByIdAndUpdate(ruleId, updates, { new: true });
      if (rule) {
        this.rulesEngine.updateRule(rule.name, updates);
        this.logger.info(`Rule updated: ${rule.name}`);
      } else {
        this.logger.warn(`Rule not found: ${ruleId}`);
      }
    } catch (error) {
      this.logger.error('Error updating rule:', error);
      throw error;
    }
  }

  async evaluateRules(data) {
    try {
      const result = await this.rulesEngine.evaluate(data);
      this.logger.info('Rules evaluated:', result);
      return result;
    } catch (error) {
      this.logger.error('Error evaluating rules:', error);
      throw error;
    }
  }

  async predictDecision(data) {
    try {
      const result = this.decisionTree.evaluate(data);
      this.logger.info('Decision predicted:', result);
      return result;
    } catch (error) {
      this.logger.error('Error predicting decision:', error);
      throw error;
    }
  }

  async processText(text) {
    try {
      const result = NLPProcessor.processText(text);
      this.logger.info('Text processed:', result);
      return result;
    } catch (error) {
      this.logger.error('Error processing text:', error);
      throw error;
    }
  }

  async processTextAdvanced(text, options) {
    try {
      
      const result = NLPProcessor.processTextAdvanced(text, options);
      this.logger.info('Text processed with advanced options:', result);
      return result;
    } catch (error) {
      this.logger.error('Error processing text with advanced options:', error);
      throw error;
    }
  }
}

export default AIService;
