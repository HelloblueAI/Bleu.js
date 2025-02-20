//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.

'use strict';

const NLPProcessor = require('../ai/nlpProcessor');
const ModelManager = require('../ml/modelManager');
const logger = require('../src/utils/logger');

class AIService {
  constructor() {
    this.nlpProcessor = new NLPProcessor();
    this.modelManager = new ModelManager();
  }

  /**
   * Analyzes the given text using NLP techniques.
   * @param {string} text - The input text to analyze.
   * @returns {Object} Analysis results (tokens, sentiment, named entities).
   */
  analyzeText(text) {
    if (!text || typeof text !== 'string') {
      logger.error('❌ Invalid input. Text must be a non-empty string.');
      throw new Error('Invalid input. Text must be a non-empty string.');
    }

    logger.info('🔍 Starting text analysis');

    try {
      const tokens = this.nlpProcessor.tokenize(text);
      logger.info(`📌 Tokens: ${tokens.join(', ')}`);

      const stemmedTokens = tokens.map((token) =>
        this.nlpProcessor.stem(token),
      );
      logger.info(`📌 Stemmed Tokens: ${stemmedTokens.join(', ')}`);

      const sentiment = this.nlpProcessor.analyzeSentiment(text);
      logger.info(`📊 Sentiment: ${sentiment}`);

      const entities = this.nlpProcessor.namedEntityRecognition(text);
      logger.info(`📌 Named Entities: ${entities.join(', ')}`);

      return { tokens, stemmedTokens, sentiment, entities };
    } catch (error) {
      logger.error(`❌ Error during text analysis: ${error.message}`);
      throw error;
    }
  }

  /**
   * Performs an NLP operation.
   * @param {string} text - The input text.
   * @returns {Object} Analysis result.
   */
  async doSomething(text) {
    logger.info('🔄 Running text analysis process');
    try {
      const analysisResult = this.analyzeText(text);
      logger.info('✅ Text analysis completed successfully');
      return analysisResult;
    } catch (error) {
      logger.error(`❌ Error during text analysis: ${error.message}`);
      throw error;
    }
  }

  /**
   * Trains the AI model with given information.
   * @param {Object} modelInfo - Model training parameters.
   * @returns {Promise<Object>} Training result.
   */
  async trainModel(modelInfo) {
    logger.info('🚀 Training model', modelInfo);
    try {
      return await this.modelManager.trainModel(modelInfo);
    } catch (error) {
      logger.error(`❌ Error training model: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves the training status of the AI model.
   * @returns {Promise<Object>} Training status.
   */
  async getTrainModelStatus() {
    logger.info('📊 Retrieving model training status');
    try {
      return await this.modelManager.getTrainModelStatus();
    } catch (error) {
      logger.error(`❌ Error getting training model status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Uploads a dataset for training.
   * @param {Object} dataset - Dataset object.
   * @returns {Promise<Object>} Upload result.
   */
  async uploadDataset(dataset) {
    logger.info('📤 Uploading dataset');
    try {
      return await this.modelManager.uploadDataset(dataset);
    } catch (error) {
      logger.error(`❌ Error uploading dataset: ${error.message}`);
      throw error;
    }
  }

  /**
   * Evaluates a given rule with input data.
   * @param {string} ruleId - The ID of the rule.
   * @param {Object} inputData - Input data for rule evaluation.
   * @returns {Promise<Object>} Rule evaluation result.
   */
  async evaluateRule(ruleId, inputData) {
    logger.info(`🔎 Evaluating rule: ${ruleId}`);
    try {
      return await this.modelManager.evaluateRule(ruleId, inputData);
    } catch (error) {
      logger.error(`❌ Error evaluating rule ${ruleId}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = AIService;
