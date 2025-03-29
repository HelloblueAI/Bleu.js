import { Logger } from '../utils/logger';
import { Storage } from '../storage/storage';
import { CoreConfig } from '../types';
import { ProcessingError } from '../utils/errors';
import * as tf from '@tensorflow/tfjs';

export class SelfLearningCore {
  private model: tf.LayersModel | null = null;
  private learningInterval: NodeJS.Timeout | null = null;
  private config: CoreConfig;
  private logger: Logger;
  private storage: Storage;

  constructor(storage: Storage, logger: Logger, config: CoreConfig) {
    if (!storage || !logger || !config) {
      throw new ProcessingError('Invalid dependencies for SelfLearningCore');
    }
    this.storage = storage;
    this.logger = logger;
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing self-learning core');
      await this.loadModel();
      this.startLearningLoop();
      this.logger.info('Self-learning core initialized');
    } catch (error) {
      this.logger.error('Failed to initialize self-learning core', error);
      throw error;
    }
  }

  private async loadModel(): Promise<void> {
    try {
      this.logger.info('Loading model');
      const savedModel = await this.storage.get('model');
      if (savedModel) {
        this.model = await tf.loadLayersModel(savedModel);
        this.logger.info('Model loaded successfully');
      } else {
        this.model = this.createModel();
        this.logger.info('Created new model');
      }
    } catch (error) {
      this.logger.error('Failed to load model', error);
      throw error;
    }
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [this.config.inputDimension] }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: this.config.outputDimension, activation: 'softmax' }));

    model.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  private startLearningLoop(): void {
    this.learningInterval = setInterval(
      () => this.processMetrics(),
      this.config.learningInterval
    );
  }

  public async processMetrics(): Promise<void> {
    try {
      this.logger.info('Processing metrics for training');
      const metrics = await this.storage.get('metrics') || [];
      if (metrics.length === 0) {
        this.logger.info('No metrics to process');
        return;
      }

      const { inputs, outputs } = this.prepareTrainingData(metrics);
      await this.model!.fit(inputs, outputs, {
        epochs: this.config.epochs,
        batchSize: this.config.batchSize,
        validationSplit: 0.2
      });

      await this.saveModel();
      await this.storage.save('metrics', []);
      this.logger.info('Metrics processed and model updated');
    } catch (error) {
      this.logger.error('Failed to process metrics', error);
      throw error;
    }
  }

  private prepareTrainingData(metrics: any[]): { inputs: tf.Tensor, outputs: tf.Tensor } {
    const inputs: number[][] = [];
    const outputs: number[][] = [];

    for (const metric of metrics) {
      inputs.push(metric.input);
      outputs.push(metric.output);
    }

    return {
      inputs: tf.tensor2d(inputs),
      outputs: tf.tensor2d(outputs)
    };
  }

  async predict(input: number[]): Promise<number[]> {
    try {
      this.logger.info('Making prediction');
      if (!this.model) {
        throw new ProcessingError('Model not initialized');
      }

      const inputTensor = tf.tensor2d([input]);
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      const result = await prediction.array();
      inputTensor.dispose();
      prediction.dispose();

      return result[0];
    } catch (error) {
      this.logger.error('Failed to make prediction', error);
      throw error;
    }
  }

  private async saveModel(): Promise<void> {
    try {
      this.logger.info('Saving model');
      if (!this.model) {
        throw new ProcessingError('Model not initialized');
      }

      const modelJson = await this.model.toJSON();
      await this.storage.save('model', modelJson);
      this.logger.info('Model saved successfully');
    } catch (error) {
      this.logger.error('Failed to save model', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      this.logger.info('Cleaning up self-learning core');
      if (this.learningInterval) {
        clearInterval(this.learningInterval);
        this.learningInterval = null;
      }

      await this.saveModel();
      if (this.model) {
        this.model.dispose();
        this.model = null;
      }

      this.logger.info('Self-learning core cleanup completed');
    } catch (error) {
      this.logger.error('Failed to cleanup self-learning core', error);
      throw error;
    }
  }
} 