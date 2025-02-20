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

/* eslint-env node */

const compromise = require('compromise');
const natural = require('natural');
const logger = require('../../utils/logger'); // Logging added

const { WordTokenizer, PorterStemmer, SentimentAnalyzer, BayesClassifier } =
  natural;

class NLPProcessor {
  constructor() {
    this.tokenizer = new WordTokenizer();
    this.stemmer = PorterStemmer;
    this.sentimentAnalyzer = new SentimentAnalyzer(
      'English',
      this.stemmer,
      'afinn',
    );
    this.classifier = new BayesClassifier();
    this.ner = compromise;
  }

  /**
   * Tokenizes input text into an array of words
   * @param {string} text - The text to tokenize
   * @returns {string[]} Array of tokens
   * @throws {Error} If input is invalid
   */
  tokenize(text) {
    if (!text || typeof text !== 'string') {
      logger.error('❌ tokenize() -> Invalid input');
      throw new Error('Invalid input. Text must be a non-empty string.');
    }
    return this.tokenizer.tokenize(text);
  }

  /**
   * Stems a word using Porter Stemmer algorithm
   * @param {string} word - The word to stem
   * @returns {string} Stemmed word
   * @throws {Error} If input is invalid
   */
  stem(word) {
    if (!word || typeof word !== 'string') {
      logger.error('❌ stem() -> Invalid word input');
      throw new Error('Invalid input. Word must be a non-empty string.');
    }
    return this.stemmer.stem(word);
  }

  /**
   * Analyzes sentiment of a given text
   * @param {string} text - The input text
   * @returns {number} Sentiment score (-1 to 1)
   */
  analyzeSentiment(text) {
    const tokens = this.tokenize(text);
    const score = this.sentimentAnalyzer.getSentiment(tokens);
    logger.info(`🔍 Sentiment Analysis: ${score}`);
    return score;
  }

  /**
   * Classifies text into a category using a trained Bayes classifier
   * @param {string} text - The text to classify
   * @returns {string} Category label
   * @throws {Error} If input is invalid
   */
  classify(text) {
    if (!text || typeof text !== 'string') {
      logger.error('❌ classify() -> Invalid text input');
      throw new Error('Invalid input. Text must be a non-empty string.');
    }
    const category = this.classifier.classify(text);
    logger.info(`🧠 Classification: "${text}" -> ${category}`);
    return category;
  }

  /**
   * Adds a training document for classification
   * @param {string} text - The training text
   * @param {string} category - The category label
   * @throws {Error} If input is invalid
   */
  addDocument(text, category) {
    if (
      !text ||
      typeof text !== 'string' ||
      !category ||
      typeof category !== 'string'
    ) {
      logger.error('❌ addDocument() -> Invalid input');
      throw new Error(
        'Invalid input. Text and category must be non-empty strings.',
      );
    }
    this.classifier.addDocument(text, category);
    logger.info(`📚 Document Added: "${text}" -> ${category}`);
  }

  /**
   * Trains the classifier on added documents
   */
  trainClassifier() {
    try {
      this.classifier.train();
      logger.info('🧠 Classifier trained successfully');
    } catch (error) {
      logger.error(`❌ trainClassifier() -> Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extracts named entities from text
   * @param {string} text - The input text
   * @returns {string[]} Extracted named entities
   */
  namedEntityRecognition(text) {
    if (!text || typeof text !== 'string') {
      logger.error('❌ namedEntityRecognition() -> Invalid text input');
      throw new Error('Invalid input. Text must be a non-empty string.');
    }
    const entities = this.ner(text).topics().out('array');
    logger.info(`🔍 Named Entities: ${entities.join(', ') || 'None'}`);
    return entities;
  }

  /**
   * Processes text to return tokenization, stemming, and classification
   * @param {string} text - The input text
   * @returns {Object} Processed text data
   */
  processText(text) {
    try {
      const tokens = this.tokenize(text);
      const stemmedWords = tokens.map((token) => this.stem(token));
      const classification = this.classify(text);

      return { tokens, stemmedWords, classification };
    } catch (error) {
      logger.error(`❌ processText() -> Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Processes text for advanced analysis, including sentiment and named entity recognition
   * @param {string} text - The input text
   * @returns {Object} Processed text data
   */
  processTextAdvanced(text) {
    try {
      return {
        sentiment: this.analyzeSentiment(text),
        entities: this.namedEntityRecognition(text),
      };
    } catch (error) {
      logger.error(`❌ processTextAdvanced() -> Error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = NLPProcessor;
