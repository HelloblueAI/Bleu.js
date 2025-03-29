import * as tf from '@tensorflow/tfjs';
import { logger } from '../utils/logger';

export interface UncertaintyConfig {
  confidenceThreshold: number;
  uncertaintyMetric: 'entropy' | 'variance' | 'mutual_information';
  useEnsembleUncertainty: boolean;
  calibrationMethod: 'platt' | 'isotonic' | 'none';
}

export class UncertaintyHandler {
  private config: UncertaintyConfig;
  private calibrationModel: tf.LayersModel | null;

  constructor(config: UncertaintyConfig) {
    this.config = config;
    this.calibrationModel = null;
  }

  async calculateUncertainty(predictions: tf.Tensor): Promise<tf.Tensor> {
    return tf.tidy(() => {
      switch (this.config.uncertaintyMetric) {
        case 'entropy':
          return this.calculateEntropy(predictions);
        case 'variance':
          return this.calculateVariance(predictions);
        case 'mutual_information':
          return this.calculateMutualInformation(predictions);
        default:
          return this.calculateEntropy(predictions);
      }
    });
  }

  private calculateEntropy(predictions: tf.Tensor): tf.Tensor {
    return tf.tidy(() => {
      const logPreds = tf.log(predictions.add(tf.scalar(1e-7)));
      const entropy = predictions.mul(logPreds).sum(-1).mul(tf.scalar(-1));
      return entropy;
    });
  }

  private calculateVariance(predictions: tf.Tensor): tf.Tensor {
    return tf.tidy(() => {
      const mean = predictions.mean(-1, true);
      const squaredDiff = predictions.sub(mean).square();
      return squaredDiff.mean(-1);
    });
  }

  private calculateMutualInformation(predictions: tf.Tensor): tf.Tensor {
    return tf.tidy(() => {
      const entropy = this.calculateEntropy(predictions);
      const conditionalEntropy = this.calculateConditionalEntropy(predictions);
      return entropy.sub(conditionalEntropy);
    });
  }

  private calculateConditionalEntropy(predictions: tf.Tensor): tf.Tensor {
    return tf.tidy(() => {
      const logPreds = tf.log(predictions.add(tf.scalar(1e-7)));
      return predictions.mul(logPreds).mean(-1).mul(tf.scalar(-1));
    });
  }

  async calibrate(predictions: tf.Tensor, labels: tf.Tensor): Promise<void> {
    if (this.config.calibrationMethod === 'none') {
      return;
    }

    tf.tidy(() => {
      switch (this.config.calibrationMethod) {
        case 'platt':
          this.calibrationModel = this.createPlattScalingModel();
          break;
        case 'isotonic':
          this.calibrationModel = this.createIsotonicRegressionModel();
          break;
      }

      if (this.calibrationModel) {
        this.calibrationModel.compile({
          optimizer: 'adam',
          loss: 'binaryCrossentropy',
          metrics: ['accuracy']
        });
      }
    });

    if (this.calibrationModel) {
      await this.calibrationModel.fit(predictions, labels, {
        epochs: 100,
        batchSize: 32,
        verbose: 0
      });
    }
  }

  private createPlattScalingModel(): tf.LayersModel {
    const input = tf.input({shape: [1]});
    const dense = tf.layers.dense({units: 1, activation: 'sigmoid'}).apply(input);
    return tf.model({inputs: input, outputs: dense as tf.SymbolicTensor});
  }

  private createIsotonicRegressionModel(): tf.LayersModel {
    const input = tf.input({shape: [1]});
    const dense1 = tf.layers.dense({units: 10, activation: 'relu'}).apply(input);
    const dense2 = tf.layers.dense({units: 1, activation: 'sigmoid'}).apply(dense1);
    return tf.model({inputs: input, outputs: dense2 as tf.SymbolicTensor});
  }

  async getCalibrated(predictions: tf.Tensor): Promise<tf.Tensor> {
    if (!this.calibrationModel || this.config.calibrationMethod === 'none') {
      return predictions;
    }
    return this.calibrationModel.predict(predictions) as tf.Tensor;
  }

  async dispose(): Promise<void> {
    if (this.calibrationModel) {
      this.calibrationModel.dispose();
    }
  }
} 