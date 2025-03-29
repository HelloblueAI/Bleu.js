import * as tf from '@tensorflow/tfjs';
import { logger } from '../utils/logger';

export interface FeatureAnalyzerConfig {
  featureImportanceMethod: 'gini' | 'permutation' | 'shap';
  minFeatureImportance: number;
  useFeatureSelection: boolean;
  correlationThreshold: number;
}

export class FeatureAnalyzer {
  private config: FeatureAnalyzerConfig;
  private featureImportances: Map<string, number>;

  constructor(config: FeatureAnalyzerConfig) {
    this.config = config;
    this.featureImportances = new Map();
  }

  async analyzeFeatures(
    features: tf.Tensor,
    labels: tf.Tensor,
    featureNames: string[]
  ): Promise<Map<string, number>> {
    return tf.tidy(() => {
      switch (this.config.featureImportanceMethod) {
        case 'gini':
          return this.calculateGiniImportance(features, labels, featureNames);
        case 'permutation':
          return this.calculatePermutationImportance(features, labels, featureNames);
        case 'shap':
          return this.calculateShapValues(features, labels, featureNames);
        default:
          return this.calculateGiniImportance(features, labels, featureNames);
      }
    });
  }

  private calculateGiniImportance(
    features: tf.Tensor,
    labels: tf.Tensor,
    featureNames: string[]
  ): Map<string, number> {
    const importances = new Map<string, number>();
    
    tf.tidy(() => {
      // Calculate Gini impurity for each feature
      for (let i = 0; i < featureNames.length; i++) {
        const featureValues = features.slice([0, i], [-1, 1]);
        const giniScore = this.calculateGiniImpurity(featureValues, labels);
        importances.set(featureNames[i], giniScore.dataSync()[0]);
      }
    });

    return importances;
  }

  private calculateGiniImpurity(feature: tf.Tensor, labels: tf.Tensor): tf.Tensor {
    return tf.tidy(() => {
      const uniqueValues = tf.unique(feature.flatten());
      const splits = uniqueValues.values;
      
      let bestGini = tf.scalar(1);
      splits.forEach(split => {
        const mask = feature.less(split);
        const leftLabels = tf.booleanMaskAsync(labels, mask);
        const rightLabels = tf.booleanMaskAsync(labels, mask.logicalNot());
        
        const leftGini = this.gini(leftLabels);
        const rightGini = this.gini(rightLabels);
        const weightedGini = leftGini.mul(leftLabels.shape[0])
          .add(rightGini.mul(rightLabels.shape[0]))
          .div(labels.shape[0]);
        
        bestGini = tf.minimum(bestGini, weightedGini);
      });

      return bestGini;
    });
  }

  private gini(labels: tf.Tensor): tf.Tensor {
    return tf.tidy(() => {
      const counts = tf.bincount(labels.flatten());
      const probabilities = counts.div(tf.sum(counts));
      return tf.scalar(1).sub(probabilities.square().sum());
    });
  }

  private calculatePermutationImportance(
    features: tf.Tensor,
    labels: tf.Tensor,
    featureNames: string[]
  ): Map<string, number> {
    const importances = new Map<string, number>();
    
    tf.tidy(() => {
      // Calculate baseline performance
      const baselineScore = this.calculatePerformanceScore(features, labels);
      
      // For each feature, permute values and calculate importance
      for (let i = 0; i < featureNames.length; i++) {
        const permutedFeatures = features.clone();
        const featureColumn = features.slice([0, i], [-1, 1]);
        const permutedColumn = tf.randomShuffle(featureColumn);
        permutedFeatures.slice([0, i], [-1, 1]).assign(permutedColumn);
        
        const permutedScore = this.calculatePerformanceScore(permutedFeatures, labels);
        const importance = baselineScore.sub(permutedScore);
        importances.set(featureNames[i], importance.dataSync()[0]);
      }
    });

    return importances;
  }

  private calculatePerformanceScore(features: tf.Tensor, labels: tf.Tensor): tf.Tensor {
    return tf.tidy(() => {
      // Simple accuracy metric for demonstration
      const predictions = this.makeSimplePredictions(features);
      return predictions.equal(labels).mean();
    });
  }

  private makeSimplePredictions(features: tf.Tensor): tf.Tensor {
    return tf.tidy(() => {
      // Simple decision stump for demonstration
      const meanValues = features.mean(0);
      return features.greater(meanValues);
    });
  }

  private calculateShapValues(
    features: tf.Tensor,
    labels: tf.Tensor,
    featureNames: string[]
  ): Map<string, number> {
    const importances = new Map<string, number>();
    
    tf.tidy(() => {
      // Simplified SHAP value calculation
      const baseValue = this.calculateExpectedValue(features, labels);
      
      for (let i = 0; i < featureNames.length; i++) {
        const shapValue = this.calculateFeatureContribution(
          features,
          labels,
          i,
          baseValue
        );
        importances.set(featureNames[i], shapValue.dataSync()[0]);
      }
    });

    return importances;
  }

  private calculateExpectedValue(features: tf.Tensor, labels: tf.Tensor): tf.Tensor {
    return tf.tidy(() => {
      return labels.mean();
    });
  }

  private calculateFeatureContribution(
    features: tf.Tensor,
    labels: tf.Tensor,
    featureIndex: number,
    baseValue: tf.Tensor
  ): tf.Tensor {
    return tf.tidy(() => {
      const featureValues = features.slice([0, featureIndex], [-1, 1]);
      const contribution = this.makeSimplePredictions(featureValues).sub(baseValue);
      return contribution.mean();
    });
  }

  async selectFeatures(
    features: tf.Tensor,
    featureNames: string[]
  ): Promise<string[]> {
    if (!this.config.useFeatureSelection) {
      return featureNames;
    }

    const selectedFeatures: string[] = [];
    const correlationMatrix = await this.calculateCorrelationMatrix(features);

    // Select features based on correlation and importance
    for (let i = 0; i < featureNames.length; i++) {
      const featureName = featureNames[i];
      const importance = this.featureImportances.get(featureName) || 0;

      if (importance >= this.config.minFeatureImportance) {
        const isRedundant = this.isFeatureRedundant(
          i,
          correlationMatrix,
          selectedFeatures.map(name => featureNames.indexOf(name))
        );

        if (!isRedundant) {
          selectedFeatures.push(featureName);
        }
      }
    }

    return selectedFeatures;
  }

  private async calculateCorrelationMatrix(features: tf.Tensor): Promise<tf.Tensor> {
    return tf.tidy(() => {
      const normalized = this.normalizeFeatures(features);
      const transposed = normalized.transpose();
      return tf.matMul(normalized, transposed).div(features.shape[0] - 1);
    });
  }

  private normalizeFeatures(features: tf.Tensor): tf.Tensor {
    return tf.tidy(() => {
      const mean = features.mean(0, true);
      const std = features.sub(mean).square().mean(0, true).sqrt();
      return features.sub(mean).div(std.add(tf.scalar(1e-7)));
    });
  }

  private isFeatureRedundant(
    featureIndex: number,
    correlationMatrix: tf.Tensor,
    selectedIndices: number[]
  ): boolean {
    return tf.tidy(() => {
      if (selectedIndices.length === 0) {
        return false;
      }

      const correlations = correlationMatrix.slice([featureIndex, 0], [1, -1]);
      const maxCorrelation = tf.max(
        tf.abs(correlations.gather(selectedIndices))
      );

      return maxCorrelation.greater(this.config.correlationThreshold).dataSync()[0];
    });
  }

  async dispose(): Promise<void> {
    this.featureImportances.clear();
  }
} 