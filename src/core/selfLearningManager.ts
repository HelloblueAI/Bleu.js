import { createLogger } from '../utils/logger';
import { Storage } from '../utils/storage';
import { SelfLearningCore } from './selfLearningCore';

const logger = createLogger('SelfLearningManager');

export class SelfLearningManager {
  private readonly logger = createLogger('SelfLearningManager');
  private readonly storage: Storage;
  private readonly core: SelfLearningCore;
  private isInitialized: boolean = false;

  constructor(storage: Storage) {
    this.storage = storage;
    this.core = new SelfLearningCore(storage);
    
    // Listen for learning events
    this.core.on('learningComplete', this.handleLearningComplete.bind(this));
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.core.initialize();
      this.isInitialized = true;
      this.logger.info('SelfLearningManager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize SelfLearningManager:', error);
      throw error;
    }
  }

  private handleLearningComplete(data: any): void {
    this.logger.info('Learning cycle completed:', {
      version: data.version,
      metrics: data.metrics
    });

    // Analyze the learning results and make improvements
    this.analyzeLearningResults(data.metrics);
  }

  private analyzeLearningResults(metrics: any): void {
    const { accuracy, loss } = metrics;
    
    // Log performance metrics
    this.logger.info('Learning performance:', {
      accuracy: accuracy[accuracy.length - 1],
      loss: loss[loss.length - 1]
    });

    // Implement additional analysis logic here
    // For example:
    // - Compare with historical performance
    // - Identify patterns in learning behavior
    // - Suggest improvements to the learning process
  }

  async cleanup(): Promise<void> {
    if (this.isInitialized) {
      await this.core.cleanup();
      this.isInitialized = false;
      this.logger.info('SelfLearningManager cleaned up');
    }
  }

  getMetrics(): any[] {
    return this.core.getMetrics();
  }

  getConfig(): any {
    return this.core.getConfig();
  }

  isActive(): boolean {
    return this.isInitialized;
  }
} 