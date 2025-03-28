export interface ModelConfig {
  learningRate: number;
  loss: string;
  metrics: string[];
  epochs: number;
  batchSize: number;
  layers: Array<{
    units: number;
    activation: string;
    inputShape?: number[];
    dropout?: number;
  }>;
}

export interface ModelMetrics {
  accuracy: number;
  loss: number;
  validationAccuracy: number;
  validationLoss: number;
  trainingTime: number;
  inferenceTime: number;
  memoryUsage: number;
  timestamp: string;
}

export interface TrainingData {
  features: number[][];
  labels: number[][];
}

export interface ModelState {
  weights: any[];
  optimizer: any[];
  metrics: ModelMetrics;
  timestamp: string;
}

export interface ModelEvaluation {
  loss: number;
  accuracy: number;
  confusionMatrix?: number[][];
  precision?: number;
  recall?: number;
  f1Score?: number;
}

export interface ModelPrediction {
  output: number[];
  confidence: number;
  timestamp: string;
}

export interface ModelMetadata {
  name: string;
  version: string;
  description: string;
  architecture: string;
  parameters: {
    totalParams: number;
    trainableParams: number;
    nonTrainableParams: number;
  };
  trainingHistory: {
    epochs: number;
    batches: number;
    startTime: string;
    endTime: string;
  };
  performance: {
    trainingAccuracy: number;
    validationAccuracy: number;
    trainingLoss: number;
    validationLoss: number;
  };
} 