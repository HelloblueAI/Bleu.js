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
import NLPProcessor from '../ai/nlpProcessor';
import ModelManager from '../ml/modelManager';
import { error as _error, info } from '../src/utils/logger';

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
