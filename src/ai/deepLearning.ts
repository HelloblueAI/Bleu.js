import * as tf from '@tensorflow/tfjs-node';
import { createLogger } from '../utils/logger';

// Initialize TensorFlow backend
if (!tf.getBackend()) {
  tf.setBackend('tensorflow');
}

export interface DeepLearningConfig {
  learningRate: number;
  batchSize: number;
  epochs: number;
  hiddenUnits?: number[];
  dropout?: number;
  validationSplit: number;
}

export class DeepLearningModel {
  private model: tf.LayersModel | null;
  private config: DeepLearningConfig;
  private logger: ReturnType<typeof createLogger>;
  private metrics: Map<string, number[]>;
  private isInitialized: boolean;

  constructor(config?: Partial<DeepLearningConfig>) {
    this.config = {
      learningRate: config?.learningRate ?? 0.001,
      batchSize: config?.batchSize ?? 32,
      epochs: config?.epochs ?? 10,
      hiddenUnits: config?.hiddenUnits ?? [64, 32],
      dropout: config?.dropout ?? 0.2,
      validationSplit: config?.validationSplit ?? 0.2
    };
    this.model = null;
    this.metrics = new Map();
    this.isInitialized = false;
    this.logger = createLogger('DeepLearningModel');
  }

  async initialize(inputShape: number[]): Promise<void> {
    try {
      if (this.isInitialized) {
        this.logger.warn('Model already initialized');
        return;
      }

      await tf.setBackend('tensorflow');
      
      const model = tf.sequential();
      
      // Input layer
      model.add(tf.layers.dense({
        units: this.config.hiddenUnits![0],
        activation: 'relu',
        inputShape: [inputShape[0]]
      }));
      
      model.add(tf.layers.dropout({ rate: this.config.dropout }));
      
      // Hidden layers
      for (let i = 1; i < this.config.hiddenUnits!.length; i++) {
        model.add(tf.layers.dense({
          units: this.config.hiddenUnits![i],
          activation: 'relu'
        }));
        model.add(tf.layers.dropout({ rate: this.config.dropout }));
      }
      
      // Output layer
      model.add(tf.layers.dense({
        units: 1,
        activation: 'sigmoid'
      }));
      
      const optimizer = tf.train.adam(this.config.learningRate);
      
      model.compile({
        optimizer,
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });
      
      this.model = model;
      this.isInitialized = true;
      this.logger.info('Model initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize model:', error);
      throw error;
    }
  }

  async train(x: tf.Tensor | number[][], y: tf.Tensor | number[]): Promise<void> {
    try {
      if (!this.isInitialized || !this.model) {
        throw new Error('Model not initialized');
      }

      const xTensor = Array.isArray(x) ? tf.tensor2d(x) : x;
      const yTensor = Array.isArray(y) ? tf.tensor1d(y) : y;

      const result = await this.model.fit(xTensor, yTensor, {
        epochs: this.config.epochs,
        batchSize: this.config.batchSize,
        validationSplit: this.config.validationSplit,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (logs) {
              this.logger.info(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
              this.recordMetric('loss', logs.loss);
              this.recordMetric('acc', logs.acc);
            }
          }
        }
      });

      // Record final metrics
      const finalLoss = result.history.loss?.[result.history.loss.length - 1];
      const finalAcc = result.history.acc?.[result.history.acc.length - 1];

      if (finalLoss !== undefined) {
        this.recordMetric('loss', finalLoss);
      }
      if (finalAcc !== undefined) {
        this.recordMetric('acc', finalAcc);
      }

      this.logger.info('Training completed successfully');
    } catch (error) {
      this.logger.error('Failed to train model:', error);
      throw error;
    }
  }

  async predict(x: tf.Tensor | number[][]): Promise<number[]> {
    try {
      if (!this.isInitialized || !this.model) {
        throw new Error('Model not initialized');
      }

      const startTime = Date.now();
      const xTensor = Array.isArray(x) ? tf.tensor2d(x) : x;
      const predictions = await this.model.predict(xTensor) as tf.Tensor;
      const values = await predictions.array() as number[];
      predictions.dispose();

      const endTime = Date.now();
      this.recordMetric('inferenceTime', endTime - startTime);

      return values;
    } catch (error) {
      this.logger.error('Failed to make predictions:', error);
      throw error;
    }
  }

  async evaluate(x: tf.Tensor | number[][], y: tf.Tensor | number[]): Promise<{ loss: number; accuracy: number }> {
    try {
      if (!this.isInitialized || !this.model) {
        throw new Error('Model not initialized');
      }

      const xTensor = Array.isArray(x) ? tf.tensor2d(x) : x;
      const yTensor = Array.isArray(y) ? tf.tensor1d(y) : y;

      const [loss, accuracy] = await this.model.evaluate(xTensor, yTensor) as tf.Scalar[];
      const metrics = {
        loss: await loss.dataSync()[0],
        accuracy: await accuracy.dataSync()[0]
      };

      loss.dispose();
      accuracy.dispose();

      this.logger.info('Evaluation metrics:', metrics);
      return metrics;
    } catch (error) {
      this.logger.error('Failed to evaluate model:', error);
      throw error;
    }
  }

  private recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getMetrics(): Map<string, number[]> {
    return new Map(this.metrics);
  }

  async dispose(): Promise<void> {
    try {
      if (this.model) {
        this.model.dispose();
        this.model = null;
      }
      this.isInitialized = false;
      this.metrics.clear();
      this.logger.info('Model disposed successfully');
    } catch (error) {
      this.logger.error('Failed to dispose model:', error);
      throw error;
    }
  }

  async saveState(): Promise<void> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }
    await this.model.save('file://./model-state');
  }

  async loadState(): Promise<void> {
    try {
      this.model = await tf.loadLayersModel('file://./model-state/model.json');
      this.model.compile({
        optimizer: tf.train.adam(),
        loss: 'meanSquaredError',
        metrics: ['accuracy']
      });
    } catch (error) {
      throw new Error(`Failed to load model state: ${error.message}`);
    }
  }
} 