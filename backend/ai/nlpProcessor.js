const natural = require('natural');
const compromise = require('compromise');

class NLPProcessor {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.sentimentAnalyzer = new natural.SentimentAnalyzer('English', this.stemmer, 'afinn');
    this.classifier = new natural.BayesClassifier();
    this.ner = compromise;
  }

  tokenize(text) {
    return this.tokenizer.tokenize(text);
  }

  stem(word) {
    return this.stemmer.stem(word);
  }

  analyzeSentiment(text) {
    const tokens = this.tokenize(text);
    return this.sentimentAnalyzer.getSentiment(tokens);
  }

  classify(text) {
    return this.classifier.classify(text);
  }

  addDocument(text, category) {
    this.classifier.addDocument(text, category);
  }

  trainClassifier() {
    this.classifier.train();
  }

  namedEntityRecognition(text) {
    const doc = this.ner(text);
    return doc.topics().out('array');
  }
}

module.exports = NLPProcessor;
