import { Logger } from '../../utils/logger';
import { ProcessingError } from '../../utils/errors';
import * as natural from 'natural';
import { Storage } from '../../storage/storage';
import { TextAnalyzer } from './analyzer';
import { SentimentAnalyzer } from './sentiment';
import { EntityRecognizer } from './entityRecognizer';
import { NLPProcessorConfig } from './types';

export interface ProcessResult {
  tokens: string[];
  entities: any[];
  sentiment: {
    score: number;
    label: string;
  };
  language: string;
  complexity: {
    readabilityScore: number;
    sentenceCount: number;
    averageWordLength: number;
  };
}

export interface NLPConfig {
  language: string;
  maxTokens: number;
  model: string;
}

export interface ProcessedText {
  text: string;
  tokens: string[];
  embeddings: number[][];
  sentiment: {
    score: number;
    label: string;
  };
  entities: Array<{
    text: string;
    type: string;
    start: number;
    end: number;
  }>;
}

export class NLPProcessor {
  private logger: Logger;
  private config: NLPConfig;
  private initialized: boolean = false;
  private tokenizer: natural.WordTokenizer;
  private classifier: natural.BayesClassifier;
  private storage: Storage;
  private readonly analyzer: TextAnalyzer;
  private readonly sentimentAnalyzer: SentimentAnalyzer;
  private readonly entityRecognizer: EntityRecognizer;

  constructor(config: NLPProcessorConfig, logger: Logger) {
    this.logger = logger;
    this.tokenizer = new natural.WordTokenizer();
    this.classifier = new natural.BayesClassifier();
    this.analyzer = new TextAnalyzer();
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.entityRecognizer = new EntityRecognizer({
      modelPath: config.modelPath,
      vocabSize: config.vocabSize,
      maxSequenceLength: config.maxSequenceLength
    });
  }

  async initialize(config?: NLPConfig): Promise<void> {
    try {
      this.config = config || {
        language: 'en',
        maxTokens: 1024,
        model: 'gpt-3.5-turbo'
      };

      this.logger.info('NLP Processor initialized', this.config);
      this.initialized = true;
    } catch (error) {
      this.logger.error('Failed to initialize NLP Processor', error);
      throw new ProcessingError('Failed to initialize NLP Processor');
    }
  }

  async summarizeText(text: string): Promise<string> {
    if (!this.initialized) {
      throw new ProcessingError('NLP Processor not initialized');
    }

    if (!text) {
      throw new ProcessingError('Text is required for summarization');
    }

    try {
      this.logger.debug('Summarizing text', { length: text.length });
      const sentences = natural.SentenceTokenizer.tokenize(text);
      const summary = sentences.slice(0, 3).join(' ');
      this.logger.info('Text summarized successfully');
      return summary;
    } catch (error) {
      this.logger.error('Failed to summarize text', error);
      throw new ProcessingError('Failed to summarize text');
    }
  }

  async analyzeText(text: string): Promise<{
    sentiment: string;
    entities: string[];
    keywords: string[];
  }> {
    if (!this.initialized) {
      throw new ProcessingError('NLP Processor not initialized');
    }

    if (!text) {
      throw new ProcessingError('Text is required for analysis');
    }

    try {
      this.logger.debug('Analyzing text', { length: text.length });
      const tokens = this.tokenizer.tokenize(text);
      const sentiment = this.analyzeSentiment(text);
      const entities = this.extractEntities(text);
      const keywords = this.extractKeywords(text);

      this.logger.info('Text analysis completed successfully');
      return {
        sentiment,
        entities,
        keywords
      };
    } catch (error) {
      this.logger.error('Failed to analyze text', error);
      throw new ProcessingError('Failed to analyze text');
    }
  }

  private analyzeSentiment(text: string): string {
    const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
    const sentiment = analyzer.getSentiment(this.tokenizer.tokenize(text));
    return sentiment > 0 ? 'positive' : sentiment < 0 ? 'negative' : 'neutral';
  }

  private extractEntities(text: string): string[] {
    // Placeholder for entity extraction
    // In a real implementation, this would use a proper NER model
    return [];
  }

  private extractKeywords(text: string): string[] {
    const tokens = this.tokenizer.tokenize(text);
    const tfidf = new natural.TfIdf();
    tfidf.addDocument(tokens);
    
    const keywords: string[] = [];
    tfidf.listTerms(0).slice(0, 5).forEach(item => {
      keywords.push(item.term);
    });
    
    return keywords;
  }

  async cleanup(): Promise<void> {
    try {
      this.logger.info('Cleaning up NLPProcessor');
      this.initialized = false;
      this.logger.info('NLPProcessor cleaned up successfully');
    } catch (error) {
      this.logger.error('Failed to cleanup NLP Processor', error);
      throw new ProcessingError('Failed to cleanup NLP Processor');
    }
  }

  async processText(text: string): Promise<ProcessedText> {
    if (!this.initialized) {
      throw new Error('NLP processor not initialized');
    }

    try {
      // Get text embeddings
      const embeddings = await this.analyzer.analyze(text);

      // Get sentiment analysis
      const sentiment = await this.sentimentAnalyzer.analyze(text);

      // Get entity recognition
      const entities = await this.entityRecognizer.recognize(text);

      // Tokenize text (simple whitespace tokenization for now)
      const tokens = text.split(/\s+/);

      return {
        text,
        tokens,
        embeddings,
        sentiment,
        entities
      };
    } catch (error) {
      this.logger.error('Failed to process text:', error);
      throw error;
    }
  }

  async train(
    texts: string[],
    labels: {
      sentiment?: number[];
      entities?: Array<Array<{ type: string; start: number; end: number }>>;
    }
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error('NLP processor not initialized');
    }

    try {
      const trainingPromises: Promise<void>[] = [];

      if (labels.sentiment) {
        trainingPromises.push(
          this.sentimentAnalyzer.train(texts, labels.sentiment)
        );
      }

      if (labels.entities) {
        trainingPromises.push(
          this.entityRecognizer.train(texts, labels.entities)
        );
      }

      await Promise.all(trainingPromises);
      this.logger.info('NLP models trained successfully');
    } catch (error) {
      this.logger.error('Failed to train NLP models:', error);
      throw error;
    }
  }

  async save(): Promise<void> {
    if (!this.initialized) {
      throw new Error('NLP processor not initialized');
    }

    try {
      await Promise.all([
        this.analyzer.save(),
        this.sentimentAnalyzer.save(),
        this.entityRecognizer.save()
      ]);
      this.logger.info('NLP models saved successfully');
    } catch (error) {
      this.logger.error('Failed to save NLP models:', error);
      throw error;
    }
  }

  async load(): Promise<void> {
    try {
      await Promise.all([
        this.analyzer.load(),
        this.sentimentAnalyzer.load(),
        this.entityRecognizer.load()
      ]);
      this.initialized = true;
      this.logger.info('NLP models loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load NLP models:', error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    await Promise.all([
      this.analyzer.dispose(),
      this.sentimentAnalyzer.dispose(),
      this.entityRecognizer.dispose()
    ]);
    this.initialized = false;
  }
} 