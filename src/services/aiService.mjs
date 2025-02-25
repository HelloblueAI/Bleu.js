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

import NLPProcessor from '../ai/nlpProcessor.mjs';
import ModelManager from '../ml/modelManager.mjs';
import { error as _error, info } from '../utils/logger.mjs';

class AIService {
  constructor() {
    try {
      this.nlpProcessor = new NLPProcessor();
      this.modelManager = new ModelManager();
      info('✅ AIService initialized successfully');
    } catch (err) {
      _error(`❌ Error initializing AIService: ${err.message}`);
      throw new Error('Failed to initialize AIService');
    }
  }

  /** 📌 Analyzes text using NLP techniques */
  analyzeText(text) {
    if (!text || typeof text !== 'string') {
      _error('❌ Invalid input: Text must be a non-empty string.');
      throw new Error('Invalid input: Text must be a non-empty string.');
    }

    info('🔍 Starting text analysis...');
    try {
      const tokens = this.nlpProcessor.tokenize(text);
      const stemmedTokens = tokens.map((token) =>
        this.nlpProcessor.stem(token),
      );
      const sentiment = this.nlpProcessor.analyzeSentiment(text);
      const entities = this.nlpProcessor.namedEntityRecognition(text);

      info(
        `✅ Analysis Complete. Sentiment: ${sentiment}, Entities: ${entities.join(', ')}`,
      );

      return { tokens, stemmedTokens, sentiment, entities };
    } catch (err) {
      _error(`❌ Text analysis failed: ${err.message}`);
      throw err;
    }
  }

  /** 📌 Wrapper function to process a text input */
  async processText(text) {
    info('⚙️ Processing text...');
    try {
      return this.analyzeText(text);
    } catch (err) {
      _error(`❌ Failed to process text: ${err.message}`);
      throw err;
    }
  }

  /** 📌 Trains an AI model */
  async trainModel(modelInfo) {
    info(`🎯 Training model with parameters: ${JSON.stringify(modelInfo)}`);
    try {
      return await this.modelManager.trainModel(modelInfo);
    } catch (err) {
      _error(`❌ Model training failed: ${err.message}`);
      throw err;
    }
  }

  /** 📌 Retrieves the current training status */
  async getTrainModelStatus() {
    info('📡 Fetching model training status...');
    try {
      return await this.modelManager.getTrainModelStatus();
    } catch (err) {
      _error(`❌ Failed to retrieve model status: ${err.message}`);
      throw err;
    }
  }

  /** 📌 Uploads a dataset for AI model training */
  async uploadDataset(dataset) {
    info(`📂 Uploading dataset (${dataset.name || 'Unnamed Dataset'})...`);
    try {
      return await this.modelManager.uploadDataset(dataset);
    } catch (err) {
      _error(`❌ Dataset upload failed: ${err.message}`);
      throw err;
    }
  }

  /** 📌 Evaluates a rule using AI models */
  async evaluateRule(ruleId, inputData) {
    info(
      `📏 Evaluating rule: ${ruleId} with data: ${JSON.stringify(inputData)}`,
    );
    try {
      return await this.modelManager.evaluateRule(ruleId, inputData);
    } catch (err) {
      _error(`❌ Rule evaluation failed: ${err.message}`);
      throw err;
    }
  }
}

export default AIService;
