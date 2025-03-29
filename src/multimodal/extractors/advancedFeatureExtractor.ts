import * as tf from '@tensorflow/tfjs';
import { logger } from '../../utils/logger';

export interface FeatureExtractorConfig {
  featureSize: number;
  usePretrained: boolean;
  modelPath?: string;
}

export class AdvancedFeatureExtractor {
  private config: FeatureExtractorConfig;
  private model: tf.LayersModel | null = null;
  private initialized: boolean = false;

  constructor(config: FeatureExtractorConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      this.model = this.buildModel();
      if (this.config.usePretrained && this.config.modelPath) {
        await this.loadPretrainedModel();
      }
      this.initialized = true;
      logger.info('AdvancedFeatureExtractor initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AdvancedFeatureExtractor:', error);
      throw error;
    }
  }

  private buildModel(): tf.LayersModel {
    const model = tf.sequential();

    // Feature extraction layers
    model.add(tf.layers.conv2d({
      filters: 64,
      kernelSize: 3,
      activation: 'relu'
    }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
    model.add(tf.layers.conv2d({
      filters: 128,
      kernelSize: 3,
      activation: 'relu'
    }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({
      units: this.config.featureSize,
      activation: 'relu'
    }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['accuracy']
    });

    return model;
  }

  private async loadPretrainedModel(): Promise<void> {
    if (!this.model || !this.config.modelPath) return;

    try {
      await this.model.loadWeights(this.config.modelPath);
      logger.info('Pretrained model weights loaded successfully');
    } catch (error) {
      logger.error('Failed to load pretrained model weights:', error);
      throw error;
    }
  }

  async extractFeatures(input: tf.Tensor): Promise<tf.Tensor> {
    if (!this.initialized) {
      throw new Error('AdvancedFeatureExtractor not initialized');
    }

    try {
      const features = this.model!.predict(input) as tf.Tensor;
      return features;
    } catch (error) {
      logger.error('Error during feature extraction:', error);
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