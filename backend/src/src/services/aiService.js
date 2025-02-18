'use strict';

var _Object$defineProperty = require('@babel/runtime-corejs3/core-js-stable/object/define-property');
var _interopRequireDefault = require('@babel/runtime-corejs3/helpers/interopRequireDefault');
_Object$defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;
var _map = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/instance/map'),
);
var _nlpProcessor = _interopRequireDefault(require('../ai/nlpProcessor'));
var _modelManager = _interopRequireDefault(require('../ml/modelManager'));
var _logger = require('../src/utils/logger');
class AIService {
  constructor() {
    this.nlpProcessor = new _nlpProcessor.default();
    this.modelManager = new _modelManager.default();
  }
  analyzeText(text) {
    if (!text || typeof text !== 'string') {
      (0, _logger.error)('Invalid input. Text must be a non-empty string.');
      throw new Error('Invalid input. Text must be a non-empty string.');
    }
    (0, _logger.info)('Starting text analysis');
    try {
      const tokens = this.nlpProcessor.tokenize(text);
      (0, _logger.info)(`Tokens: ${tokens.join(', ')}`);
      const stemmedTokens = (0, _map.default)(tokens).call(tokens, (token) =>
        this.nlpProcessor.stem(token),
      );
      (0, _logger.info)(`Stemmed Tokens: ${stemmedTokens.join(', ')}`);
      const sentiment = this.nlpProcessor.analyzeSentiment(text);
      (0, _logger.info)(`Sentiment: ${sentiment}`);
      const entities = this.nlpProcessor.namedEntityRecognition(text);
      (0, _logger.info)(`Named Entities: ${entities.join(', ')}`);
      return {
        tokens,
        stemmedTokens,
        sentiment,
        entities,
      };
    } catch (error) {
      (0, _logger.error)(`Error during text analysis: ${error.message}`);
      throw error;
    }
  }
  async doSomething(text) {
    (0, _logger.info)('Doing something');
    try {
      const analysisResult = this.analyzeText(text);
      (0, _logger.info)('Text analysis completed successfully');
      return analysisResult;
    } catch (error) {
      (0, _logger.error)(`Error during text analysis: ${error.message}`);
      throw error;
    }
  }
  async trainModel(modelInfo) {
    (0, _logger.info)('Training model with info:', modelInfo);
    try {
      return await this.modelManager.trainModel(modelInfo);
    } catch (error) {
      (0, _logger.error)(`Error training model: ${error.message}`);
      throw error;
    }
  }
  async getTrainModelStatus() {
    (0, _logger.info)('Getting train model status');
    try {
      return await this.modelManager.getTrainModelStatus();
    } catch (error) {
      (0, _logger.error)(`Error getting train model status: ${error.message}`);
      throw error;
    }
  }
  async uploadDataset(dataset) {
    (0, _logger.info)('Uploading dataset:', dataset);
    try {
      return await this.modelManager.uploadDataset(dataset);
    } catch (error) {
      (0, _logger.error)(`Error uploading dataset: ${error.message}`);
      throw error;
    }
  }
  async evaluateRule(ruleId, inputData) {
    (0, _logger.info)('Evaluating rule:', ruleId, inputData);
    try {
      return await this.modelManager.evaluateRule(ruleId, inputData);
    } catch (error) {
      (0, _logger.error)(`Error evaluating rule ${ruleId}: ${error.message}`);
      throw error;
    }
  }
}
var _default = (exports.default = AIService);
