import * as tf from '@tensorflow/tfjs-node';
import { createLogger } from '../../utils/logger';
import { Storage } from '../../storage/storage';
import * as wav from 'wav';
import { Transform } from 'stream';

export interface AudioProcessorConfig {
  modelPath: string;
  sampleRate: number;
  maxDuration: number;
  allowedFormats: string[];
}

export interface ProcessedAudio {
  features: number[];
  transcription?: string;
  speaker?: string;
  emotions: Array<{
    label: string;
    confidence: number;
  }>;
}

export class AudioProcessor {
  private readonly config: AudioProcessorConfig;
  private readonly storage: Storage;
  private readonly logger = createLogger('AudioProcessor');
  private model: tf.LayersModel | null = null;
  private initialized = false;

  constructor(config: AudioProcessorConfig) {
    this.config = config;
    this.storage = new Storage({
      basePath: config.modelPath,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedExtensions: config.allowedFormats
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.storage.initialize();
      await this.createModel();
      this.initialized = true;
      this.logger.info('AudioProcessor initialized');
    } catch (error) {
      this.logger.error('AudioProcessor initialization failed:', error);
      throw new Error('AudioProcessor initialization failed');
    }
  }

  private async createModel(): Promise<void> {
    const model = tf.sequential();

    // Input layer
    model.add(tf.layers.conv1d({
      inputShape: [this.config.sampleRate * this.config.maxDuration, 1],
      filters: 32,
      kernelSize: 3,
      activation: 'relu'
    }));

    // Convolutional layers
    model.add(tf.layers.conv1d({
      filters: 64,
      kernelSize: 3,
      activation: 'relu'
    }));
    model.add(tf.layers.maxPooling1d({ poolSize: 2 }));

    model.add(tf.layers.conv1d({
      filters: 128,
      kernelSize: 3,
      activation: 'relu'
    }));
    model.add(tf.layers.maxPooling1d({ poolSize: 2 }));

    // LSTM layers
    model.add(tf.layers.lstm({ units: 128, returnSequences: true }));
    model.add(tf.layers.lstm({ units: 64 }));

    // Dense layers
    model.add(tf.layers.dense({ units: 256, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.5 }));
    model.add(tf.layers.dense({ units: 7, activation: 'softmax' })); // 7 emotion classes

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    this.model = model;
  }

  async processAudio(audioBuffer: Buffer): Promise<ProcessedAudio> {
    if (!this.initialized || !this.model) {
      throw new Error('AudioProcessor not initialized');
    }

    try {
      // Convert audio buffer to tensor
      const tensor = await this.audioToTensor(audioBuffer);

      // Get predictions
      const predictions = await this.model.predict(tensor) as tf.Tensor;
      const predictionArray = await predictions.array();

      // Process predictions
      const features = this.extractFeatures(predictionArray[0]);
      const emotions = this.detectEmotions(predictionArray[0]);

      // Cleanup tensors
      tf.dispose([tensor, predictions]);

      return {
        features,
        emotions
      };
    } catch (error) {
      this.logger.error('Failed to process audio:', error);
      throw error;
    }
  }

  private async audioToTensor(audioBuffer: Buffer): Promise<tf.Tensor> {
    return new Promise((resolve, reject) => {
      const reader = new wav.Reader();
      const chunks: number[] = [];

      reader.on('format', (format) => {
        if (format.sampleRate !== this.config.sampleRate) {
          reject(new Error(`Unsupported sample rate: ${format.sampleRate}`));
        }
      });

      reader.on('data', (chunk) => {
        // Convert buffer to array of samples
        const samples = new Float32Array(chunk.buffer);
        chunks.push(...samples);
      });

      reader.on('end', () => {
        // Truncate or pad to maxDuration
        const maxSamples = this.config.sampleRate * this.config.maxDuration;
        const samples = chunks.slice(0, maxSamples);
        const paddedSamples = new Float32Array(maxSamples);
        paddedSamples.set(samples);

        // Convert to tensor
        const tensor = tf.tensor2d(paddedSamples, [1, maxSamples, 1]);
        resolve(tensor);
      });

      reader.on('error', reject);

      reader.write(audioBuffer);
      reader.end();
    });
  }

  private extractFeatures(predictions: number[]): number[] {
    // Extract features from the last dense layer
    return predictions.slice(0, 256);
  }

  private detectEmotions(predictions: number[]): Array<{
    label: string;
    confidence: number;
  }> {
    const emotions: Array<{
      label: string;
      confidence: number;
    }> = [];

    predictions.forEach((confidence, index) => {
      if (confidence > 0.3) {
        emotions.push({
          label: this.getEmotionLabel(index),
          confidence
        });
      }
    });

    return emotions;
  }

  private getEmotionLabel(index: number): string {
    const emotions = [
      'happy',
      'sad',
      'angry',
      'fearful',
      'surprised',
      'disgusted',
      'neutral'
    ];
    return emotions[index] || 'unknown';
  }

  async train(audioBuffers: Buffer[], labels: any): Promise<void> {
    if (!this.initialized || !this.model) {
      throw new Error('Audio processor not initialized');
    }

    try {
      // Prepare training data
      const trainingData = await Promise.all(
        audioBuffers.map(audio => this.audioToTensor(audio))
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

      this.logger.info('Audio processor training completed');
    } catch (error) {
      this.logger.error('Failed to train audio processor:', error);
      throw error;
    }
  }

  async save(): Promise<void> {
    if (!this.initialized || !this.model) {
      throw new Error('Audio processor not initialized');
    }

    try {
      await this.model.save(`file://${this.config.modelPath}/model.json`);
      this.logger.info('Audio processor model saved');
    } catch (error) {
      this.logger.error('Failed to save audio processor model:', error);
      throw error;
    }
  }

  async load(): Promise<void> {
    try {
      this.model = await tf.loadLayersModel(`file://${this.config.modelPath}/model.json`);
      this.initialized = true;
      this.logger.info('Audio processor model loaded');
    } catch (error) {
      this.logger.error('Failed to load audio processor model:', error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.initialized = false;
    this.logger.info('AudioProcessor disposed');
  }
} 