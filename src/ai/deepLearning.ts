import * as tf from '@tensorflow/tfjs-node';
import { createLogger } from '../utils/logger';

const logger = createLogger('DeepLearning');

export class DeepLearning {
  private readonly logger = createLogger('DeepLearning');
  private model: tf.LayersModel | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.info('TensorFlow backend already initialized');
      return;
    }

    try {
      await tf.setBackend('cpu');
      this.initialized = true;
      this.logger.info('TensorFlow backend initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize TensorFlow backend:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.model) {
        this.model.dispose();
        this.model = null;
      }
      // Dispose of any remaining tensors
      await tf.dispose();
      this.initialized = false;
      this.logger.info('TensorFlow resources cleaned up');
    } catch (error) {
      this.logger.error('Error during cleanup:', error);
      throw error;
    }
  }
}

export interface TrainingConfig {
  epochs?: number;
  batchSize?: number;
  validationSplit?: number;
  learningRate?: number;
  optimizer?: string;
  loss?: string;
  metrics?: string[];
}

export interface TrainingMetrics {
  loss: number[];
  accuracy: number[];
  valLoss?: number[];
  valAccuracy?: number[];
}

export class DeepLearningModel {
  private model: tf.LayersModel | null;
  private readonly metrics: Map<string, number[]>;
  private isInitialized: boolean;
  private readonly logger: Logger;

  constructor() {
    this.model = null;
    this.metrics = new Map();
    this.isInitialized = false;
    this.logger = new Logger('DeepLearningModel');
  }

  async initialize(inputShape: number[]): Promise<void> {
    try {
      this.model = tf.sequential();
      this.model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape }));
      this.model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
      this.model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

      this.isInitialized = true;
      this.logger.info('Model initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize model', error as Error);
      throw error;
    }
  }

  async train(data: tf.Tensor, labels: tf.Tensor, config: TrainingConfig = {}): Promise<void> {
    if (!this.isInitialized || !this.model) {
      throw new Error('Model not initialized');
    }

    const defaultConfig: Required<TrainingConfig> = {
      epochs: 10,
      batchSize: 32,
      validationSplit: 0.2,
      learningRate: 0.001,
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    };

    const finalConfig = { ...defaultConfig, ...config };

    try {
      this.model.compile({
        optimizer: tf.train.adam(finalConfig.learningRate),
        loss: finalConfig.loss,
        metrics: finalConfig.metrics
      });

      const history = await this.model.fit(data, labels, {
        epochs: finalConfig.epochs,
        batchSize: finalConfig.batchSize,
        validationSplit: finalConfig.validationSplit,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (logs) {
              Object.entries(logs).forEach(([metric, value]) => {
                const values = this.metrics.get(metric) || [];
                values.push(value as number);
                this.metrics.set(metric, values);
              });
            }
            this.logger.info(`Epoch ${epoch + 1}/${finalConfig.epochs} completed`);
          }
        }
      });

      this.logger.info('Training completed successfully');
      return history;
    } catch (error) {
      this.logger.error('Failed to train model', error as Error);
      throw error;
    }
  }

  async predict(data: tf.Tensor): Promise<tf.Tensor> {
    if (!this.isInitialized || !this.model) {
      throw new Error('Model not initialized');
    }

    try {
      const predictions = this.model.predict(data);
      this.logger.info('Predictions generated successfully');
      return predictions;
    } catch (error) {
      this.logger.error('Failed to generate predictions', error as Error);
      throw error;
    }
  }

  async save(path: string): Promise<void> {
    if (!this.isInitialized || !this.model) {
      throw new Error('Model not initialized');
    }

    try {
      await this.model.save(`file://${path}`);
      this.logger.info(`Model saved successfully to ${path}`);
    } catch (error) {
      this.logger.error(`Failed to save model to ${path}`, error as Error);
      throw error;
    }
  }

  async load(path: string): Promise<void> {
    try {
      this.model = await tf.loadLayersModel(`file://${path}`);
      this.isInitialized = true;
      this.logger.info(`Model loaded successfully from ${path}`);
    } catch (error) {
      this.logger.error(`Failed to load model from ${path}`, error as Error);
      throw error;
    }
  }

  getMetrics(): TrainingMetrics {
    return {
      loss: this.metrics.get('loss') || [],
      accuracy: this.metrics.get('accuracy') || [],
      valLoss: this.metrics.get('val_loss'),
      valAccuracy: this.metrics.get('val_accuracy')
    };
  }

  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.isInitialized = false;
      this.metrics.clear();
      this.logger.info('Model disposed successfully');
    }
  }
} 