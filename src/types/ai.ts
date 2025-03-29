export interface ModelConfig {
  type: 'text' | 'image' | 'multimodal';
  architecture: {
    layers: number[];
    activation: string;
    optimizer: string;
    learningRate: number;
    dropout?: number;
    regularization?: {
      type: 'l1' | 'l2' | 'elastic';
      strength: number;
    };
    attention?: {
      type: 'self' | 'cross' | 'multi-head';
      heads: number;
      dim: number;
    };
    normalization?: {
      type: 'batch' | 'layer' | 'instance';
      epsilon: number;
    };
  };
  training: {
    epochs: number;
    batchSize: number;
    validationSplit: number;
    earlyStopping?: {
      patience: number;
      minDelta: number;
    };
    learningRateSchedule?: {
      type: 'step' | 'cosine' | 'exponential';
      initialRate: number;
      decayRate: number;
      steps?: number[];
    };
    gradientClipping?: {
      type: 'norm' | 'value';
      threshold: number;
    };
  };
  deployment: {
    target: 'cpu' | 'gpu' | 'quantum';
    optimization: boolean;
    quantization: boolean;
    memoryEfficient?: boolean;
    mixedPrecision?: boolean;
  };
}

export interface TrainingConfig {
  trainingData: {
    inputs: any[];
    targets: any[];
    metadata?: Record<string, any>;
  };
  validationData?: {
    inputs: any[];
    targets: any[];
    metadata?: Record<string, any>;
  };
  augmentation?: {
    enabled: boolean;
    techniques: {
      type: string;
      params: Record<string, any>;
    }[];
  };
  curriculum?: {
    enabled: boolean;
    stages: {
      difficulty: number;
      data: {
        inputs: any[];
        targets: any[];
      };
      epochs: number;
    }[];
  };
  distillation?: {
    enabled: boolean;
    teacherModel: any;
    temperature: number;
    alpha: number;
  };
  quantization: boolean;
  metrics: string[];
  callbacks?: {
    onEpochEnd?: (epoch: number, metrics: Record<string, number>) => void;
    onBatchEnd?: (batch: number, metrics: Record<string, number>) => void;
    onTrainingEnd?: (metrics: Record<string, number>) => void;
  };
}

export interface InferenceConfig {
  data: {
    inputs: any[];
    metadata?: Record<string, any>;
  };
  batchSize?: number;
  preprocessing?: {
    enabled: boolean;
    steps: {
      type: string;
      params: Record<string, any>;
    }[];
  };
  postprocessing?: {
    enabled: boolean;
    steps: {
      type: string;
      params: Record<string, any>;
    }[];
  };
  metrics: string[];
  confidenceThreshold?: number;
  maxTokens?: number;
  temperature?: number;
  topK?: number;
  topP?: number;
  beamWidth?: number;
  callbacks?: {
    onInferenceStart?: () => void;
    onInferenceEnd?: (results: any) => void;
    onError?: (error: Error) => void;
  };
}

export interface ModelMetrics {
  performance: {
    accuracy: number;
    loss: number;
    precision: number;
    recall: number;
    f1Score: number;
    confusionMatrix: number[][];
  };
  efficiency: {
    inferenceTime: number;
    memoryUsage: number;
    throughput: number;
    latency: number;
  };
  quality: {
    robustness: number;
    fairness: number;
    interpretability: number;
    stability: number;
  };
  training: {
    epochs: number;
    batchSize: number;
    learningRate: number;
    gradientNorm: number;
    validationLoss: number;
  };
}

export interface ModelState {
  weights: any;
  optimizer: any;
  metrics: ModelMetrics;
  config: ModelConfig;
  version: string;
  timestamp: number;
  metadata: Record<string, any>;
}

export interface TrainingProgress {
  epoch: number;
  batch: number;
  metrics: Record<string, number>;
  learningRate: number;
  gradientNorm: number;
  validationMetrics?: Record<string, number>;
  timestamp: number;
}

export interface ModelValidationResult {
  isValid: boolean;
  issues: {
    type: 'warning' | 'error';
    message: string;
    details?: any;
  }[];
  metrics: ModelMetrics;
  recommendations: string[];
} 