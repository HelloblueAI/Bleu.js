import { Logger } from '../../utils/logger';
import { Storage } from '../../storage/storage';
import { CoreConfig } from '../../types/config';
import { ProcessingError } from '../../types/errors';
import * as tf from '@tensorflow/tfjs-node';

export class SelfLearningCore {
  private readonly logger: Logger;
  private readonly storage: Storage;
  private readonly config: CoreConfig;
  private model: tf.LayersModel | null = null;
  private learningInterval: NodeJS.Timeout | null = null;
  private initialized = false;

  constructor(storage: Storage, logger: Logger, config: CoreConfig) {
    if (!storage || !logger || !config) {
      throw new ProcessingError('Invalid dependencies provided to SelfLearningCore');
    }

    this.storage = storage;
    this.logger = logger;
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing SelfLearningCore');
      
      // Load or create model
      await this.loadModel();
      
      // Start learning loop
      this.startLearningLoop();
      
      this.initialized = true;
      this.logger.info('SelfLearningCore initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize SelfLearningCore:', error);
      throw new ProcessingError('Failed to initialize self-learning core');
    }
  }

  private async loadModel(): Promise<void> {
    try {
      const savedModel = await this.storage.get('model');
      if (savedModel) {
        this.model = await tf.loadLayersModel(tf.io.browserFiles([savedModel]));
        this.logger.info('Loaded existing model');
      } else {
        this.model = this.createModel();
        this.logger.info('Created new model');
      }
    } catch (error) {
      this.logger.error('Failed to load model:', error);
      throw new ProcessingError('Failed to load model');
    }
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ units: 64, activation: 'relu', inputShape: [this.config.inputSize] }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: this.config.outputSize, activation: 'softmax' })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  private startLearningLoop(): void {
    this.learningInterval = setInterval(async () => {
      try {
        await this.processMetrics();
      } catch (error) {
        this.logger.error('Error in learning loop:', error);
      }
    }, this.config.learningInterval);
  }

  private async processMetrics(): Promise<void> {
    try {
      const metrics = await this.storage.get('metrics') || [];
      if (metrics.length === 0) {
        return;
      }

      // Prepare training data
      const { inputs, outputs } = this.prepareTrainingData(metrics);

      // Train model
      await this.model!.fit(inputs, outputs, {
        epochs: 1,
        batchSize: 32,
        shuffle: true
      });

      // Save updated model
      await this.saveModel();

      // Clear processed metrics
      await this.storage.save('metrics', []);
    } catch (error) {
      this.logger.error('Failed to process metrics:', error);
      throw new ProcessingError('Failed to process metrics');
    }
  }

  private prepareTrainingData(metrics: any[]): { inputs: tf.Tensor; outputs: tf.Tensor } {
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
      const inputTensor = tf.tensor2d([input]);
      const prediction = this.model!.predict(inputTensor) as tf.Tensor;
      const result = await prediction.data();
      return Array.from(result);
    } catch (error) {
      this.logger.error('Failed to make prediction:', error);
      throw new ProcessingError('Failed to make prediction');
    }
  }

  private async saveModel(): Promise<void> {
    try {
      const modelData = await this.model!.save(tf.io.browserFiles);
      await this.storage.save('model', modelData);
      this.logger.info('Model saved successfully');
    } catch (error) {
      this.logger.error('Failed to save model:', error);
      throw new ProcessingError('Failed to save model');
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.learningInterval) {
        clearInterval(this.learningInterval);
      }

      if (this.model) {
        await this.saveModel();
        this.model.dispose();
      }

      this.initialized = false;
      this.logger.info('SelfLearningCore cleaned up successfully');
    } catch (error) {
      this.logger.error('Failed to cleanup SelfLearningCore:', error);
      throw new ProcessingError('Failed to cleanup self-learning core');
    }
  }
} 