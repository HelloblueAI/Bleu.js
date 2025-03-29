import * as tf from '@tensorflow/tfjs';
import { logger } from '../utils/logger';
import { CrossModalFusion, CrossModalFusionConfig } from './fusion/crossModalFusion';
import { AdvancedFeatureExtractor, FeatureExtractorConfig } from './extractors/advancedFeatureExtractor';
import { ModelManager, ModelConfig } from './models/modelManager';

export interface MultimodalProcessorConfig {
  fusion: CrossModalFusionConfig;
  featureExtractor: FeatureExtractorConfig;
  model: ModelConfig;
}

export interface MultimodalInput {
  text?: string;
  image?: tf.Tensor;
  audio?: tf.Tensor;
  video?: tf.Tensor;
}

export interface MultimodalOutput {
  features: tf.Tensor;
  confidence: number;
  modalities: {
    text?: number;
    image?: number;
    audio?: number;
    video?: number;
  };
}

export class MultimodalProcessor {
  private config: MultimodalProcessorConfig;
  private fusion: CrossModalFusion;
  private featureExtractor: AdvancedFeatureExtractor;
  private modelManager: ModelManager;
  private initialized: boolean = false;

  constructor(config: MultimodalProcessorConfig) {
    this.config = config;
    this.fusion = new CrossModalFusion(config.fusion);
    this.featureExtractor = new AdvancedFeatureExtractor(config.featureExtractor);
    this.modelManager = new ModelManager(config.model);
  }

  async initialize(): Promise<void> {
    try {
      await Promise.all([
        this.fusion.initialize(),
        this.featureExtractor.initialize(),
        this.modelManager.initialize()
      ]);
      this.initialized = true;
      logger.info('MultimodalProcessor initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize MultimodalProcessor:', error);
      throw error;
    }
  }

  async process(input: MultimodalInput): Promise<MultimodalOutput> {
    if (!this.initialized) {
      throw new Error('MultimodalProcessor not initialized');
    }

    try {
      const modalities: tf.Tensor[] = [];
      const confidences: Record<string, number> = {};

      // Process each modality
      if (input.text) {
        const textFeatures = await this.processText(input.text);
        modalities.push(textFeatures);
        confidences.text = this.calculateConfidence(textFeatures);
      }

      if (input.image) {
        const imageFeatures = await this.processImage(input.image);
        modalities.push(imageFeatures);
        confidences.image = this.calculateConfidence(imageFeatures);
      }

      if (input.audio) {
        const audioFeatures = await this.processAudio(input.audio);
        modalities.push(audioFeatures);
        confidences.audio = this.calculateConfidence(audioFeatures);
      }

      if (input.video) {
        const videoFeatures = await this.processVideo(input.video);
        modalities.push(videoFeatures);
        confidences.video = this.calculateConfidence(videoFeatures);
      }

      // Fuse modalities
      const fusedFeatures = await this.fusion.fuse(modalities);

      // Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence(confidences);

      return {
        features: fusedFeatures,
        confidence: overallConfidence,
        modalities: confidences
      };
    } catch (error) {
      logger.error('Error during multimodal processing:', error);
      throw error;
    }
  }

  private async processText(text: string): Promise<tf.Tensor> {
    // Convert text to tensor representation
    const textTensor = tf.tensor1d(Array.from(text).map(c => c.charCodeAt(0)));
    return this.featureExtractor.extractFeatures(textTensor);
  }

  private async processImage(image: tf.Tensor): Promise<tf.Tensor> {
    return this.featureExtractor.extractFeatures(image);
  }

  private async processAudio(audio: tf.Tensor): Promise<tf.Tensor> {
    return this.featureExtractor.extractFeatures(audio);
  }

  private async processVideo(video: tf.Tensor): Promise<tf.Tensor> {
    return this.featureExtractor.extractFeatures(video);
  }

  private calculateConfidence(features: tf.Tensor): number {
    // Calculate confidence based on feature statistics
    const mean = tf.mean(features);
    const std = tf.moments(features).variance.sqrt();
    const confidence = tf.div(mean, std.add(tf.scalar(1e-6)));
    return confidence.dataSync()[0];
  }

  private calculateOverallConfidence(confidences: Record<string, number>): number {
    const values = Object.values(confidences);
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  async dispose(): Promise<void> {
    await Promise.all([
      this.fusion.dispose(),
      this.featureExtractor.dispose(),
      this.modelManager.dispose()
    ]);
    this.initialized = false;
  }
} 