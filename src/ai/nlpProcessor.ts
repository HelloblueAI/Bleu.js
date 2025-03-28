import * as tf from '@tensorflow/tfjs';
import { createLogger } from '../utils/logger';
import { BleuAI } from './models/bleuAI';
import { SentimentAnalyzer } from '../analyzers/sentimentAnalyzer';
import { EntityRecognizer } from '../recognizers/entityRecognizer';
import { TopicModeler } from '../models/topicModeler';
import { TextSummarizer } from '../summarizers/textSummarizer';
import { QuestionAnswerer } from '../questionAnswerers/questionAnswerer';
import { NLPConfig, NLPOutput } from '../types';
import { Tokenizer } from './tokenizer';
import { EntityExtractor } from './entityExtractor';

const logger = createLogger('NLPProcessor');

export interface NLPConfig {
  language?: string;
  modelPath?: string;
  maxSequenceLength?: number;
  batchSize?: number;
}

export interface TokenizationResult {
  tokens: string[];
  tokenIds: number[];
  attentionMask: number[];
}

export interface EntityResult {
  text: string;
  label: string;
  start: number;
  end: number;
  confidence: number;
}

export interface SentimentResult {
  label: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
}

export class AdvancedNLPProcessor {
  private config: NLPConfig;

  constructor(config: NLPConfig) {
    this.config = config;
  }

  async analyzeText(text: string): Promise<NLPOutput> {
    return {
      sentiment: {
        score: 0,
        label: 'neutral'
      },
      entities: [],
      topics: [],
      summary: '',
      keywords: []
    };
  }
}

export class NLPProcessor {
  private model: tf.LayersModel | null = null;
  private config: Required<NLPConfig>;
  private tokenizer: Tokenizer;
  private sentimentAnalyzer: SentimentAnalyzer;
  private entityExtractor: EntityExtractor;
  private isInitialized: boolean = false;
  private bleuAI: BleuAI;

  constructor(config: NLPConfig = {}) {
    this.config = {
      language: config.language || 'en',
      modelPath: config.modelPath || './models/nlp',
      maxSequenceLength: config.maxSequenceLength || 512,
      batchSize: config.batchSize || 32
    };

    this.tokenizer = new Tokenizer(this.config);
    this.sentimentAnalyzer = new SentimentAnalyzer(this.config);
    this.entityExtractor = new EntityExtractor(this.config);
    this.bleuAI = new BleuAI();

    logger.info(`Initialized NLP Processor with language: ${this.config.language}`);
  }

  async initialize(): Promise<void> {
    try {
      await this.sentimentAnalyzer.initialize();
      await this.bleuAI.initialize();
      this.isInitialized = true;
      logger.info('NLP Processor initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize NLP Processor:', error);
      throw error;
    }
  }

  async processText(text: string): Promise<{
    sentiment: string;
    confidence: number;
    entities: string[];
    keywords: string[];
  }> {
    if (!this.isInitialized) {
      throw new Error('Model or tokenizer not initialized');
    }

    logger.info(`Processing text: ${text.substring(0, 50)}...`);

    try {
      const sentiment = await this.sentimentAnalyzer.analyze(text);
      const { entities, keywords } = await this.bleuAI.extractFeatures(text);

      return {
        sentiment: sentiment.label,
        confidence: sentiment.score,
        entities,
        keywords
      };
    } catch (error) {
      logger.error('Error processing text:', error);
      throw error;
    }
  }

  async analyzeText(text: string): Promise<{
    sentiment: string;
    score: number;
  }> {
    if (!this.isInitialized) {
      throw new Error('Model or tokenizer not initialized');
    }

    try {
      return await this.sentimentAnalyzer.analyze(text);
    } catch (error) {
      logger.error('Error analyzing text:', error);
      throw error;
    }
  }

  async train(data: Array<{ text: string; label: string }>): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Model or tokenizer not initialized');
    }

    try {
      await this.sentimentAnalyzer.train(data);
      logger.info('Training completed successfully');
    } catch (error) {
      logger.error('Error during training:', error);
      throw error;
    }
  }

  async evaluate(testData: Array<{ text: string; label: string }>): Promise<{
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  }> {
    if (!this.isInitialized) {
      throw new Error('Model or tokenizer not initialized');
    }

    try {
      const metrics = await this.sentimentAnalyzer.evaluate(testData);
      logger.info('Evaluation completed', metrics);
      return metrics;
    } catch (error) {
      logger.error('Error during evaluation:', error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    try {
      await this.sentimentAnalyzer.dispose();
      await this.bleuAI.dispose();
      this.isInitialized = false;
      logger.info('NLP Processor disposed successfully');
    } catch (error) {
      logger.error('Error disposing NLP Processor:', error);
      throw error;
    }
  }

  private async initializeTokenizer(): Promise<Tokenizer> {
    logger.info('Initializing tokenizer...');
    const tokenizer = new Tokenizer(this.config);
    await tokenizer.loadVocabulary();
    return tokenizer;
  }

  private async initializeSentimentAnalyzer(): Promise<SentimentAnalyzer> {
    logger.info('Initializing sentiment analyzer...');
    const analyzer = new SentimentAnalyzer(this.config);
    await analyzer.loadModel();
    return analyzer;
  }

  private async initializeEntityExtractor(): Promise<EntityExtractor> {
    logger.info('Initializing entity extractor...');
    const extractor = new EntityExtractor(this.config);
    await extractor.loadRules();
    return extractor;
  }
}

export default NLPProcessor; 