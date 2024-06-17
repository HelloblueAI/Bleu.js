const natural = require('natural');
const compromise = require('compromise');

const { WordTokenizer, PorterStemmer, SentimentAnalyzer, BayesClassifier } = natural;

class NLPProcessor {
  constructor() {
    this.tokenizer = new WordTokenizer();
    this.stemmer = PorterStemmer;
    this.sentimentAnalyzer = new SentimentAnalyzer('English', this.stemmer, 'afinn');
    this.classifier = new BayesClassifier();
    this.ner = compromise;
  }

  // Tokenizes text into individual words
  tokenize(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid input. Text must be a non-empty string.');
    }
    return this.tokenizer.tokenize(text);
  }

  // Stems a word to its root form
  stem(word) {
    if (!word || typeof word !== 'string') {
      throw new Error('Invalid input. Word must be a non-empty string.');
    }
    return this.stemmer.stem(word);
  }

  // Analyzes sentiment of text
  analyzeSentiment(text) {
    const tokens = this.tokenize(text);
    return this.sentimentAnalyzer.getSentiment(tokens);
  }

  // Classifies text into categories
  classify(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid input. Text must be a non-empty string.');
    }
    return this.classifier.classify(text);
  }

  // Adds a document to the classification training set
  addDocument(text, category) {
    if (!text || typeof text !== 'string' || !category || typeof category !== 'string') {
      throw new Error('Invalid input. Text and category must be non-empty strings.');
    }
    this.classifier.addDocument(text, category);
  }

  // Trains the classification model
  trainClassifier() {
    this.classifier.train();
  }

  // Performs Named Entity Recognition (NER) on text
  namedEntityRecognition(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid input. Text must be a non-empty string.');
    }
    const doc = this.ner(text);
    return doc.topics().out('array');
  }

  // Processes text with basic operations
  processText(text) {
    // Example: Tokenize, stem, and classify the text
    const tokens = this.tokenize(text);
    const stemmedWords = tokens.map(token => this.stem(token));
    const classification = this.classify(text);
    return {
      tokens,
      stemmedWords,
      classification
    };
  }

  // Processes text with advanced options
  processTextAdvanced(text, options = {}) {
    // Example: Analyze sentiment and perform NER
    const sentiment = this.analyzeSentiment(text);
    const entities = this.namedEntityRecognition(text);
    return {
      sentiment,
      entities
    };
  }
}

module.exports = NLPProcessor;
