import * as tf from '@tensorflow/tfjs-node';
import { createLogger } from '../../utils/logger';
import { ImageProcessor } from './imageProcessor';
import { AudioProcessor } from './audioProcessor';
import { VideoProcessor } from './videoProcessor';
import { NLPProcessor } from '../nlp/processor';

export interface MultimodalProcessorConfig {
  modelPath?: string;
  imageConfig?: {
    maxSize?: number;
    allowedFormats?: string[];
  };
  audioConfig?: {
    sampleRate?: number;
    maxDuration?: number;
    allowedFormats?: string[];
  };
  videoConfig?: {
    maxDuration?: number;
    maxResolution?: number;
    allowedFormats?: string[];
  };
  nlpConfig?: {
    maxSequenceLength?: number;
    vocabSize?: number;
  };
}

export interface ProcessedMultimodalData {
  text?: {
    tokens: string[];
    embeddings: number[][];
    sentiment: {
      score: number;
      label: string;
    };
    entities: Array<{
      text: string;
      type: string;
      start: number;
      end: number;
    }>;
  };
  image?: {
    features: number[];
    objects: Array<{
      label: string;
      confidence: number;
      bbox: [number, number, number, number];
    }>;
    scene: string;
  };
  audio?: {
    features: number[];
    transcription?: string;
    speaker?: string;
    emotions: Array<{
      label: string;
      confidence: number;
    }>;
  };
  video?: {
    frames: Array<{
      features: number[];
      objects: Array<{
        label: string;
        confidence: number;
        bbox: [number, number, number, number];
      }>;
    }>;
    actions: Array<{
      label: string;
      confidence: number;
      start: number;
      end: number;
    }>;
  };
}

export class MultimodalProcessor {
  private logger = createLogger('MultimodalProcessor');
  private imageProcessor: ImageProcessor;
  private audioProcessor: AudioProcessor;
  private videoProcessor: VideoProcessor;
  private nlpProcessor: NLPProcessor;
  private config: Required<MultimodalProcessorConfig>;
  private initialized = false;

  constructor(config: MultimodalProcessorConfig = {}) {
    this.config = {
      modelPath: config.modelPath || 'models/multimodal',
      imageConfig: {
        maxSize: config.imageConfig?.maxSize || 1024,
        allowedFormats: config.imageConfig?.allowedFormats || ['jpg', 'jpeg', 'png']
      },
      audioConfig: {
        sampleRate: config.audioConfig?.sampleRate || 16000,
        maxDuration: config.audioConfig?.maxDuration || 30,
        allowedFormats: config.audioConfig?.allowedFormats || ['wav', 'mp3']
      },
      videoConfig: {
        maxDuration: config.videoConfig?.maxDuration || 60,
        maxResolution: config.videoConfig?.maxResolution || 720,
        allowedFormats: config.videoConfig?.allowedFormats || ['mp4', 'avi']
      },
      nlpConfig: {
        maxSequenceLength: config.nlpConfig?.maxSequenceLength || 512,
        vocabSize: config.nlpConfig?.vocabSize || 50000
      }
    };

    this.imageProcessor = new ImageProcessor({
      modelPath: `${this.config.modelPath}/image`,
      maxSize: this.config.imageConfig.maxSize,
      allowedFormats: this.config.imageConfig.allowedFormats
    });

    this.audioProcessor = new AudioProcessor({
      modelPath: `${this.config.modelPath}/audio`,
      sampleRate: this.config.audioConfig.sampleRate,
      maxDuration: this.config.audioConfig.maxDuration,
      allowedFormats: this.config.audioConfig.allowedFormats
    });

    this.videoProcessor = new VideoProcessor({
      modelPath: `${this.config.modelPath}/video`,
      maxDuration: this.config.videoConfig.maxDuration,
      maxResolution: this.config.videoConfig.maxResolution,
      allowedFormats: this.config.videoConfig.allowedFormats,
      imageProcessorConfig: {
        modelPath: `${this.config.modelPath}/image`,
        maxSize: this.config.imageConfig.maxSize,
        allowedFormats: this.config.imageConfig.allowedFormats
      }
    });

    this.nlpProcessor = new NLPProcessor({
      modelPath: `${this.config.modelPath}/nlp`,
      maxSequenceLength: this.config.nlpConfig.maxSequenceLength,
      vocabSize: this.config.nlpConfig.vocabSize
    });
  }

  async initialize(): Promise<void> {
    try {
      await Promise.all([
        this.imageProcessor.initialize(),
        this.audioProcessor.initialize(),
        this.videoProcessor.initialize(),
        this.nlpProcessor.initialize()
      ]);
      this.initialized = true;
      this.logger.info('Multimodal processor initialized');
    } catch (error) {
      this.logger.error('Failed to initialize multimodal processor:', error);
      throw new Error('Failed to initialize multimodal processor');
    }
  }

  async processData(data: {
    text?: string;
    image?: Buffer;
    audio?: Buffer;
    video?: Buffer;
  }): Promise<ProcessedMultimodalData> {
    if (!this.initialized) {
      throw new Error('Multimodal processor not initialized');
    }

    try {
      const results: ProcessedMultimodalData = {};
      const processingPromises: Promise<void>[] = [];

      if (data.text) {
        processingPromises.push(
          this.nlpProcessor.processText(data.text).then(result => {
            results.text = result;
          })
        );
      }

      if (data.image) {
        processingPromises.push(
          this.imageProcessor.processImage(data.image).then(result => {
            results.image = result;
          })
        );
      }

      if (data.audio) {
        processingPromises.push(
          this.audioProcessor.processAudio(data.audio).then(result => {
            results.audio = result;
          })
        );
      }

      if (data.video) {
        processingPromises.push(
          this.videoProcessor.processVideo(data.video).then(result => {
            results.video = result;
          })
        );
      }

      await Promise.all(processingPromises);
      return results;
    } catch (error) {
      this.logger.error('Failed to process multimodal data:', error);
      throw error;
    }
  }

  async train(data: {
    texts?: string[];
    images?: Buffer[];
    audio?: Buffer[];
    video?: Buffer[];
  }, labels: {
    text?: any;
    image?: any;
    audio?: any;
    video?: any;
  }): Promise<void> {
    if (!this.initialized) {
      throw new Error('Multimodal processor not initialized');
    }

    try {
      const trainingPromises: Promise<void>[] = [];

      if (data.texts && labels.text) {
        trainingPromises.push(
          this.nlpProcessor.train(data.texts, labels.text)
        );
      }

      if (data.images && labels.image) {
        trainingPromises.push(
          this.imageProcessor.train(data.images, labels.image)
        );
      }

      if (data.audio && labels.audio) {
        trainingPromises.push(
          this.audioProcessor.train(data.audio, labels.audio)
        );
      }

      if (data.video && labels.video) {
        trainingPromises.push(
          this.videoProcessor.train(data.video, labels.video)
        );
      }

      await Promise.all(trainingPromises);
      this.logger.info('Multimodal models trained successfully');
    } catch (error) {
      this.logger.error('Failed to train multimodal models:', error);
      throw error;
    }
  }

  async save(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Multimodal processor not initialized');
    }

    try {
      await Promise.all([
        this.imageProcessor.save(),
        this.audioProcessor.save(),
        this.videoProcessor.save(),
        this.nlpProcessor.save()
      ]);
      this.logger.info('Multimodal models saved successfully');
    } catch (error) {
      this.logger.error('Failed to save multimodal models:', error);
      throw error;
    }
  }

  async load(): Promise<void> {
    try {
      await Promise.all([
        this.imageProcessor.load(),
        this.audioProcessor.load(),
        this.videoProcessor.load(),
        this.nlpProcessor.load()
      ]);
      this.initialized = true;
      this.logger.info('Multimodal models loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load multimodal models:', error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    await Promise.all([
      this.imageProcessor.dispose(),
      this.audioProcessor.dispose(),
      this.videoProcessor.dispose(),
      this.nlpProcessor.dispose()
    ]);
    this.initialized = false;
  }
} 