import * as tf from '@tensorflow/tfjs-node';
import { createLogger } from '../../utils/logger';
import { ImageProcessor, ImageProcessorConfig } from './imageProcessor';
import ffmpeg from 'fluent-ffmpeg';

export interface VideoProcessorConfig {
  modelPath: string;
  maxDuration: number;
  maxResolution: number;
  allowedFormats: string[];
  imageProcessorConfig: ImageProcessorConfig;
}

export interface ProcessedVideo {
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
}

export class VideoProcessor {
  private readonly logger = createLogger('VideoProcessor');
  private model: tf.LayersModel | null = null;
  private readonly imageProcessor: ImageProcessor;
  private readonly config: Required<VideoProcessorConfig>;
  private initialized = false;

  constructor(config: VideoProcessorConfig) {
    this.config = {
      modelPath: config.modelPath,
      maxDuration: config.maxDuration,
      maxResolution: config.maxResolution,
      allowedFormats: config.allowedFormats,
      imageProcessorConfig: config.imageProcessorConfig
    };

    this.imageProcessor = new ImageProcessor(this.config.imageProcessorConfig);
  }

  async initialize(): Promise<void> {
    try {
      await Promise.all([
        this.createModel(),
        this.imageProcessor.initialize()
      ]);
      this.initialized = true;
      this.logger.info('Video processor initialized');
    } catch (error) {
      this.logger.error('Failed to initialize video processor:', error);
      throw new Error('Failed to initialize video processor');
    }
  }

  private async createModel(): Promise<void> {
    const model = tf.sequential();

    // Time-distributed convolutional layers
    model.add(tf.layers.timeDistributed({
      layer: tf.layers.conv2d({
        inputShape: [224, 224, 3],
        filters: 64,
        kernelSize: 3,
        activation: 'relu'
      })
    }));

    model.add(tf.layers.timeDistributed({
      layer: tf.layers.maxPooling2d({ poolSize: 2 })
    }));

    model.add(tf.layers.timeDistributed({
      layer: tf.layers.conv2d({
        filters: 128,
        kernelSize: 3,
        activation: 'relu'
      })
    }));

    model.add(tf.layers.timeDistributed({
      layer: tf.layers.maxPooling2d({ poolSize: 2 })
    }));

    // LSTM layers for temporal modeling
    model.add(tf.layers.lstm({ units: 256, returnSequences: true }));
    model.add(tf.layers.lstm({ units: 128 }));

    // Dense layers
    model.add(tf.layers.dense({ units: 512, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.5 }));
    model.add(tf.layers.dense({ units: 20, activation: 'softmax' })); // 20 action classes

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    this.model = model;
  }

  async processVideo(videoBuffer: Buffer): Promise<ProcessedVideo> {
    if (!this.initialized || !this.model) {
      throw new Error('Video processor not initialized');
    }

    try {
      // Extract frames from video
      const frames = await this.extractFrames(videoBuffer);

      // Process each frame
      const processedFrames = await Promise.all(
        frames.map(frame => this.processFrame(frame))
      );

      // Get action predictions
      const actionPredictions = await this.predictActions(processedFrames);

      return {
        frames: processedFrames,
        actions: actionPredictions
      };
    } catch (error) {
      this.logger.error('Failed to process video:', error);
      throw error;
    }
  }

  private async extractFrames(videoBuffer: Buffer): Promise<Buffer[]> {
    return new Promise((resolve, reject) => {
      const frames: Buffer[] = [];
      let frameCount = 0;
      const maxFrames = this.config.maxDuration * 30; // 30 fps

      ffmpeg(videoBuffer)
        .on('error', reject)
        .on('end', () => resolve(frames))
        .on('data', (chunk) => {
          if (frameCount < maxFrames) {
            frames.push(chunk);
            frameCount++;
          }
        })
        .screenshots({
          count: maxFrames,
          folder: '/tmp',
          filename: 'frame-%i.jpg',
          size: `${this.config.maxResolution}x${this.config.maxResolution}`
        });
    });
  }

  private async processFrame(frameBuffer: Buffer): Promise<{
    features: number[];
    objects: Array<{
      label: string;
      confidence: number;
      bbox: [number, number, number, number];
    }>;
  }> {
    const result = await this.imageProcessor.processImage(frameBuffer);
    return {
      features: result.features,
      objects: result.objects
    };
  }

  private async predictActions(frames: Array<{
    features: number[];
    objects: Array<{
      label: string;
      confidence: number;
      bbox: [number, number, number, number];
    }>;
  }>): Promise<Array<{
    label: string;
    confidence: number;
    start: number;
    end: number;
  }>> {
    // Convert frames to tensor
    const frameTensors = frames.map(frame => tf.tensor(frame.features));
    const inputTensor = tf.stack(frameTensors);

    // Get predictions
    const predictions = await this.model!.predict(inputTensor) as tf.Tensor;
    const predictionArray = await predictions.array();

    // Process predictions
    const actions: Array<{
      label: string;
      confidence: number;
      start: number;
      end: number;
    }> = [];

    predictionArray[0].forEach((confidence, index) => {
      if (confidence > 0.5) {
        actions.push({
          label: this.getActionLabel(index),
          confidence,
          start: 0,
          end: frames.length - 1
        });
      }
    });

    // Cleanup tensors
    tf.dispose([...frameTensors, inputTensor, predictions]);

    return actions;
  }

  private getActionLabel(index: number): string {
    const actions = [
      'walking', 'running', 'jumping', 'dancing', 'swimming',
      'cycling', 'driving', 'cooking', 'eating', 'drinking',
      'reading', 'writing', 'typing', 'talking', 'singing',
      'playing', 'exercising', 'sleeping', 'standing', 'sitting'
    ];
    return actions[index] || 'unknown';
  }

  async train(videoBuffers: Buffer[], labels: any): Promise<void> {
    if (!this.initialized || !this.model) {
      throw new Error('Video processor not initialized');
    }

    try {
      // Process all videos
      const processedVideos = await Promise.all(
        videoBuffers.map(video => this.processVideo(video))
      );

      // Prepare training data
      const trainingData = processedVideos.map(video =>
        tf.tensor(video.frames.map(frame => frame.features))
      );
      const trainingLabels = tf.tensor2d(labels);

      // Train model
      await this.model.fit(
        tf.concat(trainingData, 0),
        trainingLabels,
        {
          epochs: 10,
          batchSize: 32,
          validationSplit: 0.2,
          callbacks: {
            onEpochEnd: (epoch, logs) => {
              this.logger.info(`Epoch ${epoch + 1} completed:`, logs);
            }
          }
        }
      );

      // Cleanup tensors
      tf.dispose([...trainingData, trainingLabels]);

      this.logger.info('Video processor training completed');
    } catch (error) {
      this.logger.error('Failed to train video processor:', error);
      throw error;
    }
  }

  async save(): Promise<void> {
    if (!this.initialized || !this.model) {
      throw new Error('Video processor not initialized');
    }

    try {
      await Promise.all([
        this.model.save(`file://${this.config.modelPath}/model.json`),
        this.imageProcessor.save()
      ]);
      this.logger.info('Video processor models saved');
    } catch (error) {
      this.logger.error('Failed to save video processor models:', error);
      throw error;
    }
  }

  async load(): Promise<void> {
    try {
      await Promise.all([
        this.model = await tf.loadLayersModel(`file://${this.config.modelPath}/model.json`),
        this.imageProcessor.load()
      ]);
      this.initialized = true;
      this.logger.info('Video processor models loaded');
    } catch (error) {
      this.logger.error('Failed to load video processor models:', error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    await Promise.all([
      this.model?.dispose(),
      this.imageProcessor.dispose()
    ]);
    this.model = null;
    this.initialized = false;
  }
} 