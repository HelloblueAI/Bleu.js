import * as tf from '@tensorflow/tfjs-node';
import { createLogger } from '../../utils/logger';

export interface PreprocessingConfig {
  normalize?: boolean;
  standardize?: boolean;
  shuffle?: boolean;
  augment?: boolean;
  batchSize?: number;
  validationSplit?: number;
}

export interface PreprocessedData {
  train: {
    inputs: tf.Tensor;
    labels: tf.Tensor;
  };
  validation?: {
    inputs: tf.Tensor;
    labels: tf.Tensor;
  };
}

export interface TextData {
  text: string;
  label: number;
}

export class DataPreprocessor {
  private readonly logger = createLogger('DataPreprocessor');
  private readonly config: Required<PreprocessingConfig>;
  private vocabulary: Map<string, number> = new Map();
  private maxLength: number = 100;

  constructor(config: PreprocessingConfig = {}) {
    this.config = {
      normalize: config.normalize ?? true,
      standardize: config.standardize ?? false,
      shuffle: config.shuffle ?? true,
      augment: config.augment ?? false,
      batchSize: config.batchSize ?? 32,
      validationSplit: config.validationSplit ?? 0.2
    };
  }

  async preprocessData(
    inputs: tf.Tensor,
    labels: tf.Tensor
  ): Promise<PreprocessedData> {
    try {
      // Validate inputs
      if (inputs.shape[0] !== labels.shape[0]) {
        throw new Error('Number of inputs does not match number of labels');
      }

      // Shuffle data if enabled
      let shuffledInputs = inputs;
      let shuffledLabels = labels;
      if (this.config.shuffle) {
        const indices = tf.util.createShuffledIndices(inputs.shape[0]);
        shuffledInputs = tf.gather(inputs, indices);
        shuffledLabels = tf.gather(labels, indices);
      }

      // Split into train and validation sets
      const splitIndex = Math.floor(inputs.shape[0] * (1 - this.config.validationSplit));
      const trainInputs = shuffledInputs.slice([0, splitIndex]);
      const trainLabels = shuffledLabels.slice([0, splitIndex]);
      const validationInputs = shuffledInputs.slice([splitIndex]);
      const validationLabels = shuffledLabels.slice([splitIndex]);

      // Normalize or standardize inputs
      const processedTrainInputs = await this.processFeatures(trainInputs);
      const processedValidationInputs = await this.processFeatures(validationInputs);

      // Clean up intermediate tensors
      if (this.config.shuffle) {
        indices.dispose();
        shuffledInputs.dispose();
        shuffledLabels.dispose();
      }

      return {
        train: {
          inputs: processedTrainInputs,
          labels: trainLabels
        },
        validation: {
          inputs: processedValidationInputs,
          labels: validationLabels
        }
      };
    } catch (error) {
      this.logger.error('Failed to preprocess data:', error);
      throw error;
    }
  }

  private async processFeatures(inputs: tf.Tensor): Promise<tf.Tensor> {
    let processed = inputs;

    if (this.config.normalize) {
      processed = this.normalize(processed);
    }

    if (this.config.standardize) {
      processed = this.standardize(processed);
    }

    if (this.config.augment) {
      processed = await this.augment(processed);
    }

    return processed;
  }

  private normalize(inputs: tf.Tensor): tf.Tensor {
    const min = tf.min(inputs, 0);
    const max = tf.max(inputs, 0);
    const range = tf.sub(max, min);
    return tf.div(tf.sub(inputs, min), range);
  }

  private standardize(inputs: tf.Tensor): tf.Tensor {
    const mean = tf.mean(inputs, 0);
    const std = tf.sqrt(tf.mean(tf.square(tf.sub(inputs, mean)), 0));
    return tf.div(tf.sub(inputs, mean), std);
  }

  private async augment(inputs: tf.Tensor): Promise<tf.Tensor> {
    try {
      // Add random noise
      const noise = tf.randomNormal(inputs.shape, 0, 0.1);
      const augmented = tf.add(inputs, noise);

      // Clip values to valid range
      return tf.clipByValue(augmented, 0, 1);
    } catch (error) {
      this.logger.error('Failed to augment data:', error);
      throw new Error('Data augmentation failed');
    }
  }

  async createBatches(
    data: PreprocessedData,
    batchSize: number = this.config.batchSize
  ): Promise<{
    train: tf.data.Dataset;
    validation?: tf.data.Dataset;
  }> {
    try {
      // Create training dataset
      const trainDataset = tf.data
        .zip({
          xs: tf.data.array(data.train.inputs),
          ys: tf.data.array(data.train.labels)
        })
        .shuffle(1000)
        .batch(batchSize);

      // Create validation dataset if available
      let validationDataset: tf.data.Dataset | undefined;
      if (data.validation) {
        validationDataset = tf.data
          .zip({
            xs: tf.data.array(data.validation.inputs),
            ys: tf.data.array(data.validation.labels)
          })
          .batch(batchSize);
      }

      return {
        train: trainDataset,
        validation: validationDataset
      };
    } catch (error) {
      this.logger.error('Failed to create batches:', error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    // Clean up any remaining tensors
    tf.engine().startScope();
    tf.engine().endScope();
  }

  async prepare(data: TextData[]): Promise<PreprocessedData> {
    try {
      // Build vocabulary
      this.buildVocabulary(data.map(d => d.text));

      // Convert text to sequences
      const sequences = data.map(d => this.textToSequence(d.text));
      
      // Pad sequences
      const paddedSequences = this.padSequences(sequences);

      return {
        features: paddedSequences,
        labels: data.map(d => d.label)
      };
    } catch (error) {
      this.logger.error('Failed to preprocess data:', error);
      throw new Error('Data preprocessing failed');
    }
  }

  async processText(texts: string[]): Promise<number[][]> {
    try {
      const sequences = texts.map(text => this.textToSequence(text));
      return this.padSequences(sequences);
    } catch (error) {
      this.logger.error('Failed to process text:', error);
      throw new Error('Text processing failed');
    }
  }

  private buildVocabulary(texts: string[]): void {
    const words = new Set<string>();
    texts.forEach(text => {
      text.toLowerCase().split(/\s+/).forEach(word => words.add(word));
    });

    Array.from(words).sort().forEach((word, index) => {
      this.vocabulary.set(word, index + 1); // 0 is reserved for padding
    });
  }

  private textToSequence(text: string): number[] {
    return text.toLowerCase()
      .split(/\s+/)
      .map(word => this.vocabulary.get(word) || 0)
      .slice(0, this.maxLength);
  }

  private padSequences(sequences: number[][]): number[][] {
    return sequences.map(seq => {
      const padded = new Array(this.maxLength).fill(0);
      seq.forEach((val, i) => {
        if (i < this.maxLength) padded[i] = val;
      });
      return padded;
    });
  }
} 