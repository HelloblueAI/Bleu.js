const NLPProcessor = require('../ai/nlpProcessor');
const ModelManager = require('../ml/modelManager');
const logger = require('../src/utils/logger');

class AIService {
  constructor() {
    this.nlpProcessor = new NLPProcessor();
    this.modelManager = new ModelManager();
  }

  analyzeText(text) {
    if (!text || typeof text !== 'string') {
      logger.error('Invalid input. Text must be a non-empty string.');
      throw new Error('Invalid input. Text must be a non-empty string.');
    }

    logger.info('Starting text analysis');

    try {
      const tokens = this.nlpProcessor.tokenize(text);
      logger.info(`Tokens: ${tokens.join(', ')}`);

      const stemmedTokens = tokens.map((token) =>
        this.nlpProcessor.stem(token),
      );
      logger.info(`Stemmed Tokens: ${stemmedTokens.join(', ')}`);

      const sentiment = this.nlpProcessor.analyzeSentiment(text);
      logger.info(`Sentiment: ${sentiment}`);

      const entities = this.nlpProcessor.namedEntityRecognition(text);
      logger.info(`Named Entities: ${entities.join(', ')}`);

      return {
        tokens,
        stemmedTokens,
        sentiment,
        entities,
      };
    } catch (error) {
      logger.error(`Error during text analysis: ${error.message}`);
      throw error;
    }
  }

  async doSomething(text) {
    logger.info('Doing something');
    try {
      const analysisResult = this.analyzeText(text);
      logger.info('Text analysis completed successfully');
      return analysisResult;
    } catch (error) {
      logger.error(`Error during text analysis: ${error.message}`);
      throw error;
    }
  }

  async trainModel(modelInfo) {
    logger.info('Training model with info:', modelInfo);
    try {
      return await this.modelManager.trainModel(modelInfo);
    } catch (error) {
      logger.error(`Error training model: ${error.message}`);
      throw error;
    }
  }

  async getTrainModelStatus() {
    logger.info('Getting train model status');
    try {
      return await this.modelManager.getTrainModelStatus();
    } catch (error) {
      logger.error(`Error getting train model status: ${error.message}`);
      throw error;
    }
  }

  async uploadDataset(dataset) {
    logger.info('Uploading dataset:', dataset);
    try {
      return await this.modelManager.uploadDataset(dataset);
    } catch (error) {
      logger.error(`Error uploading dataset: ${error.message}`);
      throw error;
    }
  }

  async evaluateRule(ruleId, inputData) {
    logger.info('Evaluating rule:', ruleId, inputData);
    try {
      return await this.modelManager.evaluateRule(ruleId, inputData);
    } catch (error) {
      logger.error(`Error evaluating rule ${ruleId}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = AIService;
