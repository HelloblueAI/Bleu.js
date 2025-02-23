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

import NLPProcessor from '../ai/nlpProcessor.mjs';
import ModelManager from '../ml/modelManager.mjs';
import logger from '../utils/logger.mjs';

class AIService {
  constructor() {
    this.nlpProcessor = new NLPProcessor();
    this.modelManager = new ModelManager();
  }

  /**
   * Analyzes the given text using NLP techniques.
   * @param {string} text - The input text to analyze.
   * @returns {Promise<Object>} Analysis results (tokens, sentiment, named entities).
   */
  async analyzeText(text) {
    if (!text || typeof text !== 'string') {
      logger.error({ message: 'Invalid input. Text must be a non-empty string.', input: text });
      throw new Error('Invalid input. Text must be a non-empty string.');
    }

    logger.info({ message: '🔍 Starting text analysis', input: text });

    try {
      const tokens = await this.nlpProcessor.tokenize(text);
      const stemmedTokens = tokens.map((token) => this.nlpProcessor.stem(token));
      const sentiment = await this.nlpProcessor.analyzeSentiment(text);
      const entities = await this.nlpProcessor.namedEntityRecognition(text);

      logger.info({
        message: '📊 NLP Analysis Completed',
        tokens,
        stemmedTokens,
        sentiment,
        entities,
      });

      return { tokens, stemmedTokens, sentiment, entities };
    } catch (error) {
      logger.error({ message: '❌ Error during text analysis', error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Trains the AI model with given data.
   * @param {Object} modelInfo - Training parameters.
   * @returns {Promise<Object>} Training result.
   */
  async trainModel(modelInfo) {
    logger.info({ message: '🚀 Training AI model', modelInfo });

    try {
      const result = await this.modelManager.trainModel(modelInfo);
      logger.info({ message: '✅ Model training completed successfully', result });
      return result;
    } catch (error) {
      logger.error({ message: '❌ Error during model training', error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Retrieves the AI model training status.
   * @returns {Promise<Object>} Training status.
   */
  async getTrainModelStatus() {
    logger.info({ message: '📊 Fetching model training status' });

    try {
      const status = await this.modelManager.getTrainModelStatus();
      logger.info({ message: '✅ Retrieved model training status', status });
      return status;
    } catch (error) {
      logger.error({ message: '❌ Error fetching training status', error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Uploads a dataset for training.
   * @param {Object} dataset - Dataset object.
   * @returns {Promise<Object>} Upload result.
   */
  async uploadDataset(dataset) {
    logger.info({ message: '📤 Uploading dataset', dataset });

    try {
      const result = await this.modelManager.uploadDataset(dataset);
      logger.info({ message: '✅ Dataset uploaded successfully', result });
      return result;
    } catch (error) {
      logger.error({ message: '❌ Error uploading dataset', error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Evaluates a given AI rule with input data.
   * @param {string} ruleId - Rule identifier.
   * @param {Object} inputData - Input data for rule evaluation.
   * @returns {Promise<Object>} Rule evaluation result.
   */
  async evaluateRule(ruleId, inputData) {
    logger.info({ message: '🔎 Evaluating rule', ruleId, inputData });

    try {
      const result = await this.modelManager.evaluateRule(ruleId, inputData);
      logger.info({ message: '✅ Rule evaluation successful', result });
      return result;
    } catch (error) {
      logger.error({ message: `❌ Error evaluating rule ${ruleId}`, error: error.message, stack: error.stack });
      throw error;
    }
  }
}

export default AIService;
