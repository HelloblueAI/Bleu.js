import { logger } from '../../utils/logger';
import { ImageProcessor } from './processors/image';
import { AudioProcessor } from './processors/audio';
import { VideoProcessor } from './processors/video';
import { TextProcessor } from './processors/text';
import { CodeProcessor } from './processors/code';
import { CrossModalFusion } from './fusion/crossModalFusion';
import { AdvancedFeatureExtractor } from './featureExtraction/advancedFeatureExtractor';
import { CrossModalAttention } from './attention/crossModalAttention';
import { MultiModalConfig, MultiModalInput, ModalityFeatures, ProcessedResult } from './types';
import { QuantumEnhancer } from './enhancers/quantumEnhancer';
import { SecurityManager } from './managers/securityManager';
import { PerformanceOptimizer } from './optimizers/performanceOptimizer';
import { AdvancedVisualizer } from './visualizers/advancedVisualizer';
import { EnterpriseMetrics } from './metrics/enterpriseMetrics';
import { DistributedProcessor } from './processors/distributedProcessor';
import {
  TextProcessorConfig,
  CodeProcessorConfig,
  ImageProcessorConfig,
  AudioProcessorConfig,
  VideoProcessorConfig
} from './configs/processorConfigs';

export class MultiModalProcessor {
  private config: MultiModalConfig;
  private textProcessor: TextProcessor;
  private codeProcessor: CodeProcessor;
  private imageProcessor: ImageProcessor;
  private audioProcessor: AudioProcessor;
  private videoProcessor: VideoProcessor;
  private crossModalFusion: CrossModalFusion;
  private featureExtractor: AdvancedFeatureExtractor;
  private attentionMechanism: CrossModalAttention;
  private quantumEnhancer: QuantumEnhancer;
  private securityManager: SecurityManager;
  private performanceOptimizer: PerformanceOptimizer;
  private advancedVisualizer: AdvancedVisualizer;
  private enterpriseMetrics: EnterpriseMetrics;
  private distributedProcessor: DistributedProcessor;

  constructor(config: MultiModalConfig) {
    this.config = config;
    this.quantumEnhancer = new QuantumEnhancer();
    this.securityManager = new SecurityManager();
    this.performanceOptimizer = new PerformanceOptimizer();
    this.advancedVisualizer = new AdvancedVisualizer();
    this.enterpriseMetrics = new EnterpriseMetrics();
    this.distributedProcessor = new DistributedProcessor();

    // Initialize processors with our own models
    const baseConfig = {
      modelPath: config.models.text,
      modelVersion: config.modelVersion,
      modelType: config.modelType,
      optimizationLevel: config.optimizationLevel,
      company: config.company
    };

    this.textProcessor = new TextProcessor({
      ...baseConfig,
      modelPath: config.models.text,
      maxSequenceLength: 512,
      vocabularySize: 50000
    } as TextProcessorConfig);

    this.codeProcessor = new CodeProcessor({
      ...baseConfig,
      modelPath: config.models.code,
      maxSequenceLength: 1024,
      vocabularySize: 100000,
      languageSupport: ['javascript', 'typescript', 'python', 'java', 'cpp']
    } as CodeProcessorConfig);

    this.imageProcessor = new ImageProcessor({
      ...baseConfig,
      modelPath: config.models.image,
      maxImageSize: 224,
      channels: 3,
      detectionThreshold: 0.5
    } as ImageProcessorConfig);

    this.audioProcessor = new AudioProcessor({
      ...baseConfig,
      modelPath: config.models.audio,
      sampleRate: 16000,
      maxDuration: 30,
      audioFormat: 'wav'
    } as AudioProcessorConfig);

    this.videoProcessor = new VideoProcessor({
      ...baseConfig,
      modelPath: config.models.video,
      maxFrames: 300,
      frameRate: 30,
      resolution: {
        width: 1920,
        height: 1080
      }
    } as VideoProcessorConfig);

    this.crossModalFusion = new CrossModalFusion();
    this.featureExtractor = new AdvancedFeatureExtractor();
    this.attentionMechanism = new CrossModalAttention();
  }

  async initialize(): Promise<void> {
    logger.info('Initializing MultiModal Processor with advanced capabilities...');

    // Initialize all processors
    await Promise.all([
      this.textProcessor.initialize(),
      this.codeProcessor.initialize(),
      this.imageProcessor.initialize(),
      this.audioProcessor.initialize(),
      this.videoProcessor.initialize()
    ]);

    // Initialize advanced components
    await this.crossModalFusion.initialize();
    await this.featureExtractor.initialize();
    await this.attentionMechanism.initialize();

    logger.info('MultiModal Processor initialized successfully');
  }

  async process(input: MultiModalInput): Promise<ProcessedResult> {
    try {
      // Extract features from each modality
      const features = await this.extractFeatures(input);

      // Apply cross-modal attention
      const attendedFeatures = await this.attentionMechanism.apply(features);

      // Perform cross-modal fusion
      const fusion = await this.crossModalFusion.fuse(attendedFeatures);

      // Extract advanced features
      const advancedFeatures = await this.featureExtractor.extract(attendedFeatures);

      return {
        text: input.text,
        code: input.code,
        image: input.image,
        audio: input.audio,
        video: input.video,
        features: advancedFeatures,
        fusion,
        metadata: {
          modalities: Object.keys(input).filter(key => input[key as keyof MultiModalInput] !== undefined),
          processingTime: Date.now(),
          modelVersion: this.config.modelVersion
        }
      };
    } catch (error) {
      logger.error('Error processing multimodal input:', error);
      throw error;
    }
  }

  private async extractFeatures(input: MultiModalInput): Promise<ModalityFeatures> {
    const features: ModalityFeatures = {};

    // Process each modality in parallel
    const [textFeatures, codeFeatures, imageFeatures, audioFeatures, videoFeatures] = await Promise.all([
      input.text ? this.textProcessor.extractFeatures(input.text) : Promise.resolve(undefined),
      input.code ? this.codeProcessor.extractFeatures(input.code) : Promise.resolve(undefined),
      input.image ? this.imageProcessor.extractFeatures(input.image) : Promise.resolve(undefined),
      input.audio ? this.audioProcessor.extractFeatures(input.audio) : Promise.resolve(undefined),
      input.video ? this.videoProcessor.extractFeatures(input.video) : Promise.resolve(undefined)
    ]);

    if (textFeatures) features.text = textFeatures;
    if (codeFeatures) features.code = codeFeatures;
    if (imageFeatures) features.image = imageFeatures;
    if (audioFeatures) features.audio = audioFeatures;
    if (videoFeatures) features.video = videoFeatures;

    return features;
  }

  dispose(): void {
    // Clean up resources
    this.textProcessor.dispose();
    this.codeProcessor.dispose();
    this.imageProcessor.dispose();
    this.audioProcessor.dispose();
    this.videoProcessor.dispose();
    this.crossModalFusion.dispose();
    this.featureExtractor.dispose();
    this.attentionMechanism.dispose();
    this.quantumEnhancer.dispose();
    this.securityManager.dispose();
    this.performanceOptimizer.dispose();
    this.advancedVisualizer.dispose();
    this.enterpriseMetrics.dispose();
    this.distributedProcessor.dispose();
  }
} 