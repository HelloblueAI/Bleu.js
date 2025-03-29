import { Logger } from '../utils/logger';
import { AIEngineConfig } from '../types/config';
import { AIError } from '../types/errors';
import { NLPProcessor } from '../ai/nlp/nlpProcessor';
import { SelfLearningCore } from '../ai/learning/selfLearningCore';

export class AIEngine {
  private logger: Logger;
  private config: AIEngineConfig;
  private nlpProcessor: NLPProcessor;
  private learningCore: SelfLearningCore;
  private initialized: boolean = false;

  constructor(config: AIEngineConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.nlpProcessor = new NLPProcessor({
      model: config.model || 'default',
      maxTokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.7
    }, logger);
    this.learningCore = new SelfLearningCore({
      learningRate: config.learningRate || 0.01,
      batchSize: config.batchSize || 32,
      epochs: config.epochs || 100
    }, logger);
  }

  async initialize(): Promise<void> {
    try {
      await this.nlpProcessor.initialize();
      await this.learningCore.initialize();
      this.initialized = true;
      this.logger.info('AI engine initialized');
    } catch (error) {
      this.logger.error('Failed to initialize AI engine', error);
      throw new AIError('Failed to initialize AI engine');
    }
  }

  async processText(input: string): Promise<string> {
    if (!this.initialized) {
      throw new AIError('AI engine not initialized');
    }

    try {
      return await this.nlpProcessor.process(input);
    } catch (error) {
      this.logger.error('Failed to process text', error);
      throw new AIError('Failed to process text');
    }
  }

  async predict(input: any): Promise<any> {
    if (!this.initialized) {
      throw new AIError('AI engine not initialized');
    }

    try {
      return await this.learningCore.predict(input);
    } catch (error) {
      this.logger.error('Failed to make prediction', error);
      throw new AIError('Failed to make prediction');
    }
  }

  async cleanup(): Promise<void> {
    try {
      await this.nlpProcessor.cleanup();
      await this.learningCore.cleanup();
      this.initialized = false;
      this.logger.info('AI engine cleaned up');
    } catch (error) {
      this.logger.error('Failed to cleanup AI engine', error);
      throw new AIError('Failed to cleanup AI engine');
    }
  }
} 