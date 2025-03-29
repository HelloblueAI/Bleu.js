import * as tf from '@tensorflow/tfjs';
import { logger } from '../../utils/logger';

export interface ModelConfig {
  modelPath: string;
  inputShape: number[];
  outputShape: number[];
  learningRate: number;
  batchSize: number;
}

export class ModelManager {
  private config: ModelConfig;
  private model: tf.LayersModel | null = null;
  private initialized: boolean = false;

  constructor(config: ModelConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      await this.loadModel();
      this.initialized = true;
      logger.info('ModelManager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize ModelManager:', error);
      throw error;
    }
  }

  private async loadModel(): Promise<void> {
    try {
      this.model = await tf.loadLayersModel(this.config.modelPath);
      logger.info('Model loaded successfully');
    } catch (error) {
      logger.error('Failed to load model:', error);
      throw error;
    }
  }

  async predict(input: tf.Tensor): Promise<tf.Tensor> {
    if (!this.initialized) {
      throw new Error('ModelManager not initialized');
    }

    try {
      // Ensure input shape matches expected shape
      if (!this.validateInputShape(input)) {
        throw new Error('Invalid input shape');
      }

      const prediction = this.model!.predict(input) as tf.Tensor;
      return prediction;
    } catch (error) {
      logger.error('Error during prediction:', error);
      throw error;
    }
  }

  private validateInputShape(input: tf.Tensor): boolean {
    const expectedShape = this.config.inputShape;
    const actualShape = input.shape;

    if (expectedShape.length !== actualShape.length) {
      return false;
    }

    for (let i = 0; i < expectedShape.length; i++) {
      if (expectedShape[i] !== -1 && expectedShape[i] !== actualShape[i]) {
        return false;
      }
    }

    return true;
  }

  async train(
    trainData: tf.Tensor,
    trainLabels: tf.Tensor,
    validationData?: [tf.Tensor, tf.Tensor],
    epochs: number = 10
  ): Promise<tf.History> {
    if (!this.initialized) {
      throw new Error('ModelManager not initialized');
    }

    try {
      const history = await this.model!.fit(trainData, trainLabels, {
        epochs,
        batchSize: this.config.batchSize,
        validationData,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            logger.info(`Epoch ${epoch + 1}/${epochs}: loss = ${logs?.loss}, accuracy = ${logs?.acc}`);
          }
        }
      });

      return history;
    } catch (error) {
      logger.error('Error during training:', error);
      throw error;
    }
  }

  async saveModel(path: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('ModelManager not initialized');
    }

    try {
      await this.model!.save(`file://${path}`);
      logger.info('Model saved successfully');
    } catch (error) {
      logger.error('Failed to save model:', error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.initialized = false;
  }
} 