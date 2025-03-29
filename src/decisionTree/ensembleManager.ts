import * as tf from '@tensorflow/tfjs';
import { logger } from '../utils/logger';

export interface EnsembleConfig {
  ensembleSize: number;
  ensembleMethod: 'bagging' | 'boosting' | 'stacking';
  useWeightedVoting: boolean;
  subsampleRatio: number;
}

export class EnsembleManager {
  private config: EnsembleConfig;
  private models: tf.LayersModel[];
  private modelWeights: number[];

  constructor(config: EnsembleConfig) {
    this.config = config;
    this.models = [];
    this.modelWeights = [];
  }

  async createEnsemble(baseModel: tf.LayersModel): Promise<void> {
    for (let i = 0; i < this.config.ensembleSize; i++) {
      const model = await this.createEnsembleMember(baseModel);
      this.models.push(model);
      this.modelWeights.push(1.0 / this.config.ensembleSize);
    }
  }

  private async createEnsembleMember(baseModel: tf.LayersModel): Promise<tf.LayersModel> {
    const modelConfig = baseModel.toJSON();
    const model = await tf.models.modelFromJSON(modelConfig);
    
    model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  async trainEnsemble(
    features: tf.Tensor,
    labels: tf.Tensor,
    validationData?: [tf.Tensor, tf.Tensor]
  ): Promise<void> {
    switch (this.config.ensembleMethod) {
      case 'bagging':
        await this.trainBagging(features, labels, validationData);
        break;
      case 'boosting':
        await this.trainBoosting(features, labels, validationData);
        break;
      case 'stacking':
        await this.trainStacking(features, labels, validationData);
        break;
    }
  }

  private async trainBagging(
    features: tf.Tensor,
    labels: tf.Tensor,
    validationData?: [tf.Tensor, tf.Tensor]
  ): Promise<void> {
    const numSamples = Math.floor(features.shape[0] * this.config.subsampleRatio);

    for (let i = 0; i < this.models.length; i++) {
      const [subsampledFeatures, subsampledLabels] = this.createBootstrapSample(
        features,
        labels,
        numSamples
      );

      await this.models[i].fit(subsampledFeatures, subsampledLabels, {
        epochs: 10,
        batchSize: 32,
        validationData,
        verbose: 0
      });
    }
  }

  private createBootstrapSample(
    features: tf.Tensor,
    labels: tf.Tensor,
    numSamples: number
  ): [tf.Tensor, tf.Tensor] {
    return tf.tidy(() => {
      const indices = tf.randomUniform([numSamples], 0, features.shape[0], 'int32');
      const subsampledFeatures = tf.gather(features, indices);
      const subsampledLabels = tf.gather(labels, indices);
      return [subsampledFeatures, subsampledLabels];
    });
  }

  private async trainBoosting(
    features: tf.Tensor,
    labels: tf.Tensor,
    validationData?: [tf.Tensor, tf.Tensor]
  ): Promise<void> {
    let sampleWeights = tf.ones([features.shape[0]]);

    for (let i = 0; i < this.models.length; i++) {
      // Train model on weighted samples
      await this.models[i].fit(features, labels, {
        epochs: 10,
        batchSize: 32,
        validationData,
        sampleWeight: sampleWeights,
        verbose: 0
      });

      // Update sample weights based on predictions
      const predictions = this.models[i].predict(features) as tf.Tensor;
      sampleWeights = this.updateSampleWeights(predictions, labels, sampleWeights);
      
      // Update model weight based on performance
      this.modelWeights[i] = this.calculateModelWeight(predictions, labels);
    }

    // Normalize model weights
    const weightSum = this.modelWeights.reduce((a, b) => a + b, 0);
    this.modelWeights = this.modelWeights.map(w => w / weightSum);
  }

  private updateSampleWeights(
    predictions: tf.Tensor,
    labels: tf.Tensor,
    currentWeights: tf.Tensor
  ): tf.Tensor {
    return tf.tidy(() => {
      const errors = predictions.sub(labels).abs();
      const newWeights = currentWeights.mul(tf.exp(errors));
      return newWeights.div(newWeights.sum());
    });
  }

  private calculateModelWeight(predictions: tf.Tensor, labels: tf.Tensor): number {
    return tf.tidy(() => {
      const accuracy = predictions.equal(labels).mean();
      const error = tf.scalar(1).sub(accuracy);
      return Math.log((1 - error.dataSync()[0]) / (error.dataSync()[0] + 1e-10));
    });
  }

  private async trainStacking(
    features: tf.Tensor,
    labels: tf.Tensor,
    validationData?: [tf.Tensor, tf.Tensor]
  ): Promise<void> {
    // First level: Train base models
    for (let i = 0; i < this.models.length - 1; i++) {
      await this.models[i].fit(features, labels, {
        epochs: 10,
        batchSize: 32,
        validationData,
        verbose: 0
      });
    }

    // Generate meta-features
    const metaFeatures = await this.generateMetaFeatures(features);

    // Train meta-model
    const metaModel = this.models[this.models.length - 1];
    await metaModel.fit(metaFeatures, labels, {
      epochs: 10,
      batchSize: 32,
      verbose: 0
    });
  }

  private async generateMetaFeatures(features: tf.Tensor): Promise<tf.Tensor> {
    const predictions = await Promise.all(
      this.models.slice(0, -1).map(model => 
        model.predict(features) as tf.Tensor
      )
    );

    return tf.tidy(() => {
      return tf.concat(predictions, -1);
    });
  }

  async predict(features: tf.Tensor): Promise<tf.Tensor> {
    if (this.config.ensembleMethod === 'stacking') {
      return this.predictStacking(features);
    }

    const predictions = await Promise.all(
      this.models.map(model => model.predict(features) as tf.Tensor)
    );

    return tf.tidy(() => {
      if (this.config.useWeightedVoting) {
        return this.weightedEnsemblePrediction(predictions);
      } else {
        return this.majorityVotePrediction(predictions);
      }
    });
  }

  private async predictStacking(features: tf.Tensor): Promise<tf.Tensor> {
    const metaFeatures = await this.generateMetaFeatures(features);
    const metaModel = this.models[this.models.length - 1];
    return metaModel.predict(metaFeatures) as tf.Tensor;
  }

  private weightedEnsemblePrediction(predictions: tf.Tensor[]): tf.Tensor {
    return tf.tidy(() => {
      const weightedPreds = predictions.map((pred, i) => 
        pred.mul(tf.scalar(this.modelWeights[i]))
      );
      return tf.addN(weightedPreds);
    });
  }

  private majorityVotePrediction(predictions: tf.Tensor[]): tf.Tensor {
    return tf.tidy(() => {
      const stacked = tf.stack(predictions);
      return stacked.mean(0);
    });
  }

  async dispose(): Promise<void> {
    await Promise.all(this.models.map(model => model.dispose()));
    this.models = [];
    this.modelWeights = [];
  }
} 