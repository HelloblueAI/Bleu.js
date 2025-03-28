import { LogLevel } from '../utils/logger';

export interface CoreConfig {
  port: number;
  environment: 'development' | 'production' | 'test';
  logLevel: LogLevel;
  rateLimitWindow: number;
  rateLimitMax: number;
}

export interface ModelConfig {
  type: string;
  layers: number[];
  attentionHeads?: number;
  hiddenSize?: number;
  maxSequenceLength?: number;
}

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  optimizer?: string;
  loss?: string;
  metrics?: string[];
}

export interface MonitoringConfig {
  enabled: boolean;
  interval: number;
  metrics: string[];
  notificationChannels: ('email' | 'slack' | 'webhook')[];
}

export interface BleuConfig {
  core: CoreConfig;
  model: string;
  modelPath: string;
  architecture: ModelConfig;
  training: TrainingConfig;
  monitoring: MonitoringConfig;
}

export const DEFAULT_CONFIG: BleuConfig = {
  core: {
    port: 3000,
    environment: 'development',
    logLevel: 'info',
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100
  },
  model: 'bleu-ai',
  modelPath: './models',
  architecture: {
    type: 'transformer',
    layers: [512, 256, 128],
    attentionHeads: 8,
    hiddenSize: 512,
    maxSequenceLength: 1024
  },
  training: {
    epochs: 100,
    batchSize: 32,
    learningRate: 0.001,
    optimizer: 'adam',
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  },
  monitoring: {
    enabled: true,
    interval: 60000, // 1 minute
    metrics: ['accuracy', 'loss', 'latency'],
    notificationChannels: ['email', 'slack']
  }
};