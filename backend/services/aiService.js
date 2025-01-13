import { error as _error, info } from '../src/utils/logger';
import NLPProcessor from '../ai/nlpProcessor';
import ModelManager from '../ml/modelManager';

class AIService {
  constructor() {
    this.nlpProcessor = new NLPProcessor();
    this.modelManager = new ModelManager();
  }

  analyzeText(text) {
    if (!text || typeof text !== 'string') {
      _error('Invalid input. Text must be a non-empty string.');
      throw new Error('Invalid input. Text must be a non-empty string.');
    }

    info('Starting text analysis');

    try {
      const tokens = this.nlpProcessor.tokenize(text);
      info(`Tokens: ${tokens.join(', ')}`);

      const stemmedTokens = tokens.map((token) =>
        this.nlpProcessor.stem(token),
      );
      info(`Stemmed Tokens: ${stemmedTokens.join(', ')}`);

      const sentiment = this.nlpProcessor.analyzeSentiment(text);
      info(`Sentiment: ${sentiment}`);

      const entities = this.nlpProcessor.namedEntityRecognition(text);
      info(`Named Entities: ${entities.join(', ')}`);

      return {
        tokens,
        stemmedTokens,
        sentiment,
        entities,
      };
    } catch (error) {
      _error(`Error during text analysis: ${error.message}`);
      throw error;
    }
  }

  async doSomething(text) {
    info('Doing something');
    try {
      const analysisResult = this.analyzeText(text);
      info('Text analysis completed successfully');
      return analysisResult;
    } catch (error) {
      _error(`Error during text analysis: ${error.message}`);
      throw error;
    }
  }

  async trainModel(modelInfo) {
    info('Training model with info:', modelInfo);
    try {
      return await this.modelManager.trainModel(modelInfo);
    } catch (error) {
      _error(`Error training model: ${error.message}`);
      throw error;
    }
  }

  async getTrainModelStatus() {
    info('Getting train model status');
    try {
      return await this.modelManager.getTrainModelStatus();
    } catch (error) {
      _error(`Error getting train model status: ${error.message}`);
      throw error;
    }
  }

  async uploadDataset(dataset) {
    info('Uploading dataset:', dataset);
    try {
      return await this.modelManager.uploadDataset(dataset);
    } catch (error) {
      _error(`Error uploading dataset: ${error.message}`);
      throw error;
    }
  }

  async evaluateRule(ruleId, inputData) {
    info('Evaluating rule:', ruleId, inputData);
    try {
      return await this.modelManager.evaluateRule(ruleId, inputData);
    } catch (error) {
      _error(`Error evaluating rule ${ruleId}: ${error.message}`);
      throw error;
    }
  }
}

export default AIService;
