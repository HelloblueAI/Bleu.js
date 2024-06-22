const logger = require('../src/utils/logger');
const NLPProcessor = require('../ai/nlpProcessor');
const ModelManager = require('../ml/modelManager');

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

    const tokens = this.nlpProcessor.tokenize(text);
    logger.info(`Tokens: ${tokens.join(', ')}`);

    const stemmedTokens = tokens.map((token) => this.nlpProcessor.stem(token));
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
  }

  doSomething(text) {
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
    return this.modelManager.trainModel(modelInfo);
  }

  async getTrainModelStatus() {
    logger.info('Getting train model status');
    return this.modelManager.getTrainModelStatus();
  }

  async uploadDataset(dataset) {
    logger.info('Uploading dataset:', dataset);
    return this.modelManager.uploadDataset(dataset);
  }

  async evaluateRule(ruleId, inputData) {
    logger.info('Evaluating rule:', ruleId, inputData);
    return this.modelManager.evaluateRule(ruleId, inputData);
  }
}

module.exports = AIService;
