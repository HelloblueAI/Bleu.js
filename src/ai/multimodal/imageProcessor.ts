import * as tf from '@tensorflow/tfjs-node';
import { createLogger } from '../../utils/logger';
import { Storage } from '../../storage/storage';
import sharp from 'sharp';

export interface ImageProcessorConfig {
  modelPath: string;
  inputShape: [number, number, number];  // [height, width, channels]
  batchSize: number;
  learningRate: number;
  basePath: string;
  maxFileSize: number;
  allowedExtensions: string[];
  maxSize: number;
  allowedFormats: string[];
}

export interface ProcessedImage {
  tensor: tf.Tensor;
  features: number[][];
  predictions?: {
    label: string;
    confidence: number;
  }[];
  objects: Array<{
    label: string;
    confidence: number;
    bbox: [number, number, number, number];
  }>;
  scene: string;
}

export class ImageProcessor {
  private readonly config: ImageProcessorConfig;
  private readonly storage: Storage;
  private readonly logger = createLogger('ImageProcessor');
  private model: tf.LayersModel | null = null;
  private initialized = false;

  constructor(config: ImageProcessorConfig) {
    this.config = config;
    this.storage = new Storage({
      basePath: config.basePath,
      maxFileSize: config.maxFileSize,
      allowedExtensions: config.allowedExtensions
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
      this.logger.info('ImageProcessor initialized');
    } catch (error) {
      this.logger.error('ImageProcessor initialization failed:', error);
      throw new Error('ImageProcessor initialization failed');
    }
  }

  private async createModel(): Promise<void> {
    const [height, width, channels] = this.config.inputShape;

    const model = tf.sequential({
      layers: [
        tf.layers.conv2d({
          inputShape: [height, width, channels],
          filters: 32,
          kernelSize: 3,
          activation: 'relu'
        }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.conv2d({
          filters: 64,
          kernelSize: 3,
          activation: 'relu'
        }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.flatten(),
        tf.layers.dense({ units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.5 }),
        tf.layers.dense({ units: 10, activation: 'softmax' })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    this.model = model;
  }

  async processImage(imageBuffer: Buffer): Promise<ProcessedImage> {
    if (!this.initialized || !this.model) {
      throw new Error('ImageProcessor not initialized');
    }

    try {
      // Validate image format
      const metadata = await sharp(imageBuffer).metadata();
      if (!this.config.allowedFormats.includes(metadata.format || '')) {
        throw new Error(`Unsupported image format. Allowed formats: ${this.config.allowedFormats.join(', ')}`);
      }

      // Resize image if needed
      const resizedBuffer = await this.resizeImage(imageBuffer);

      // Convert to tensor
      const tensor = await this.imageToTensor(resizedBuffer);

      // Get predictions
      const predictions = await this.model!.predict(tensor.expandDims()) as tf.Tensor;
      const predictionArray = await predictions.array();

      // Process predictions
      const features = this.extractFeatures(predictionArray[0]);
      const objects = this.detectObjects(predictionArray[0]);
      const scene = this.classifyScene(predictionArray[0]);

      // Cleanup tensors
      tf.dispose([tensor, predictions]);

      return {
        tensor: tensor,
        features,
        objects,
        scene
      };
    } catch (error) {
      this.logger.error('Failed to process image:', error);
      throw new Error('Failed to process image');
    }
  }

  private async resizeImage(imageBuffer: Buffer): Promise<Buffer> {
    const metadata = await sharp(imageBuffer).metadata();
    if (metadata.width && metadata.height) {
      const maxDimension = Math.max(metadata.width, metadata.height);
      if (maxDimension > this.config.maxSize) {
        const scale = this.config.maxSize / maxDimension;
        return sharp(imageBuffer)
          .resize(
            Math.round(metadata.width * scale),
            Math.round(metadata.height * scale),
            { fit: 'inside' }
          )
          .toBuffer();
      }
    }
    return imageBuffer;
  }

  private async imageToTensor(imageBuffer: Buffer): Promise<tf.Tensor> {
    const image = await sharp(imageBuffer)
      .resize(224, 224)
      .toBuffer();

    const pixels = new Uint8Array(image);
    const tensor = tf.tensor3d(pixels, [224, 224, 3]);
    return tensor.expandDims(0).div(255.0);
  }

  private extractFeatures(predictions: number[]): number[] {
    // Extract features from the last dense layer
    return predictions.slice(0, 10);
  }

  private detectObjects(predictions: number[]): Array<{
    label: string;
    confidence: number;
    bbox: [number, number, number, number];
  }> {
    // Simple object detection based on class probabilities
    const objects: Array<{
      label: string;
      confidence: number;
      bbox: [number, number, number, number];
    }> = [];

    predictions.forEach((confidence, index) => {
      if (confidence > 0.5) {
        objects.push({
          label: this.getObjectLabel(index),
          confidence,
          bbox: [0, 0, 1, 1] // Default to full image
        });
      }
    });

    return objects;
  }

  private classifyScene(predictions: number[]): string {
    // Get the class with highest probability
    const maxIndex = predictions.indexOf(Math.max(...predictions));
    return this.getSceneLabel(maxIndex);
  }

  private getObjectLabel(index: number): string {
    const labels = [
      'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train',
      'truck', 'boat', 'traffic light', 'fire hydrant', 'stop sign',
      'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep',
      'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella',
      'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard',
      'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard',
      'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup', 'fork',
      'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich', 'orange',
      'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair',
      'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv',
      'laptop', 'mouse', 'remote', 'keyboard', 'cell phone', 'microwave',
      'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase',
      'scissors', 'teddy bear', 'hair drier', 'toothbrush'
    ];
    return labels[index] || 'unknown';
  }

  private getSceneLabel(index: number): string {
    const scenes = [
      'indoor', 'outdoor', 'urban', 'rural', 'coastal', 'mountain',
      'forest', 'desert', 'arctic', 'tropical', 'suburban', 'industrial'
    ];
    return scenes[index % scenes.length];
  }

  async train(
    images: Buffer[],
    labels: any,
    epochs: number = 10
  ): Promise<void> {
    if (!this.initialized || !this.model) {
      throw new Error('ImageProcessor not initialized');
    }

    try {
      // Prepare training data
      const trainingData = await Promise.all(
        images.map(image => this.imageToTensor(image))
      );
      const trainingLabels = tf.tensor2d(labels);

      // Train model
      const history = await this.model.fit(
        tf.concat(trainingData, 0),
        trainingLabels,
        {
          epochs,
          batchSize: this.config.batchSize,
          validationSplit: 0.2,
          callbacks: {
            onEpochEnd: (epoch, logs) => {
              this.logger.info(`Epoch ${epoch + 1}: loss = ${logs?.loss.toFixed(4)}, accuracy = ${logs?.acc.toFixed(4)}`);
            }
          }
        }
      );

      // Cleanup tensors
      tf.dispose([...trainingData, trainingLabels]);

      this.logger.info('Training completed', { history: history.history });
    } catch (error) {
      this.logger.error('Failed to train model:', error);
      throw new Error('Failed to train model');
    }
  }

  async saveModel(): Promise<void> {
    if (!this.initialized || !this.model) {
      throw new Error('ImageProcessor not initialized');
    }

    try {
      await this.model.save(`file://${this.config.modelPath}`);
      this.logger.info('Model saved successfully');
    } catch (error) {
      this.logger.error('Failed to save model:', error);
      throw new Error('Failed to save model');
    }
  }

  async loadModel(): Promise<void> {
    try {
      this.model = await tf.loadLayersModel(`file://${this.config.modelPath}`);
      this.logger.info('Model loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load model:', error);
      throw new Error('Failed to load model');
    }
  }

  async dispose(): Promise<void> {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.initialized = false;
    this.logger.info('ImageProcessor disposed');
  }
} 