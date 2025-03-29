import * as tf from '@tensorflow/tfjs';
import { createLogger } from '../../utils/logger';

const logger = createLogger('CustomModel');

export interface CustomModelConfig {
  vocabSize: number;
  maxSequenceLength: number;
  embeddingDim: number;
  numLayers: number;
  numHeads: number;
  ffDim: number;
  dropout: number;
}

export class CustomModel {
  private model: tf.LayersModel | null = null;
  private config: CustomModelConfig;
  private tokenizer: any;
  private optimizer: tf.Optimizer;
  private loss: tf.LossOrMetricFn;

  constructor(config: CustomModelConfig) {
    this.config = config;
    this.optimizer = tf.train.adam(1e-4);
    this.loss = 'categoricalCrossentropy';
  }

  async build(): Promise<void> {
    const input = tf.layers.input({
      shape: [this.config.maxSequenceLength],
      dtype: 'int32'
    });

    // Embedding layer
    let x = tf.layers.embedding({
      inputDim: this.config.vocabSize,
      outputDim: this.config.embeddingDim
    }).apply(input);

    // Positional encoding
    x = this.addPositionalEncoding(x);

    // Transformer blocks
    for (let i = 0; i < this.config.numLayers; i++) {
      x = this.transformerBlock(x);
    }

    // Output layer
    const output = tf.layers.dense({
      units: this.config.vocabSize,
      activation: 'softmax'
    }).apply(x);

    this.model = tf.model({
      inputs: input,
      outputs: output
    });

    this.model.compile({
      optimizer: this.optimizer,
      loss: this.loss,
      metrics: ['accuracy']
    });

    logger.info('Custom model built successfully');
  }

  private addPositionalEncoding(x: tf.Tensor): tf.Tensor {
    const positions = tf.range(0, this.config.maxSequenceLength);
    const posEmbeddings = tf.layers.embedding({
      inputDim: this.config.maxSequenceLength,
      outputDim: this.config.embeddingDim
    }).apply(positions);

    return tf.layers.add().apply([x, posEmbeddings]);
  }

  private transformerBlock(x: tf.Tensor): tf.Tensor {
    // Multi-head attention
    const attention = tf.layers.multiHeadAttention({
      numHeads: this.config.numHeads,
      keyDim: this.config.embeddingDim / this.config.numHeads
    }).apply([x, x, x]);

    // Add & Norm
    x = tf.layers.layerNormalization().apply(tf.layers.add().apply([x, attention]));

    // Feed-forward network
    const ffn = tf.layers.dense({
      units: this.config.ffDim,
      activation: 'relu'
    }).apply(x);

    const ffnOutput = tf.layers.dense({
      units: this.config.embeddingDim
    }).apply(ffn);

    // Add & Norm
    return tf.layers.layerNormalization().apply(tf.layers.add().apply([x, ffnOutput]));
  }

  async train(
    trainData: tf.Tensor,
    trainLabels: tf.Tensor,
    validationData?: [tf.Tensor, tf.Tensor],
    epochs: number = 10,
    batchSize: number = 32
  ): Promise<tf.History> {
    if (!this.model) {
      throw new Error('Model not built. Call build() first.');
    }

    const history = await this.model.fit(trainData, trainLabels, {
      epochs,
      batchSize,
      validationData,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          logger.info(`Epoch ${epoch + 1} completed. Loss: ${logs?.loss.toFixed(4)}`);
        }
      }
    });

    return history;
  }

  async predict(input: tf.Tensor): Promise<tf.Tensor> {
    if (!this.model) {
      throw new Error('Model not built. Call build() first.');
    }

    return this.model.predict(input) as tf.Tensor;
  }

  async save(path: string): Promise<void> {
    if (!this.model) {
      throw new Error('Model not built. Call build() first.');
    }

    await this.model.save(`file://${path}`);
    logger.info(`Model saved to ${path}`);
  }

  async load(path: string): Promise<void> {
    this.model = await tf.loadLayersModel(`file://${path}`);
    logger.info(`Model loaded from ${path}`);
  }
} 