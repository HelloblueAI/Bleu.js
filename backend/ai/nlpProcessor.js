/* eslint-env node */
const natural = require('natural');
const compromise = require('compromise');

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

  tokenize(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid input. Text must be a non-empty string.');
    }
    return this.tokenizer.tokenize(text);
  }

  stem(word) {
    if (!word || typeof word !== 'string') {
      throw new Error('Invalid input. Word must be a non-empty string.');
    }
    return this.stemmer.stem(word);
  }

  analyzeSentiment(text) {
    const tokens = this.tokenize(text);
    return this.sentimentAnalyzer.getSentiment(tokens);
  }

  classify(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid input. Text must be a non-empty string.');
    }
    return this.classifier.classify(text);
  }

  addDocument(text, category) {
    if (
      !text ||
      typeof text !== 'string' ||
      !category ||
      typeof category !== 'string'
    ) {
      throw new Error(
        'Invalid input. Text and category must be non-empty strings.',
      );
    }
    this.classifier.addDocument(text, category);
  }

  trainClassifier() {
    this.classifier.train();
  }

  namedEntityRecognition(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid input. Text must be a non-empty string.');
    }
    const doc = this.ner(text);
    return doc.topics().out('array');
  }

  processText(text) {
    const tokens = this.tokenize(text);
    const stemmedWords = tokens.map((token) => this.stem(token));
    const classification = this.classify(text);
    return {
      tokens,
      stemmedWords,
      classification,
    };
  }

  processTextAdvanced(text) {
    const sentiment = this.analyzeSentiment(text);
    const entities = this.namedEntityRecognition(text);
    return {
      sentiment,
      entities,
    };
  }
}

module.exports = NLPProcessor;
