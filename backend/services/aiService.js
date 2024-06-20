/* eslint-env node */

const logger = require('../src/utils/logger');
const NLPProcessor = require('../ai/nlpProcessor');

class AIService {
  constructor() {
    this.nlpProcessor = new NLPProcessor();
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
}

module.exports = AIService;
