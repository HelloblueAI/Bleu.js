import { LogLevel } from './logging.js';

export interface CoreConfig {
  port: number;
  environment: 'development' | 'production' | 'test';
  logLevel: LogLevel;
  rateLimitWindow: number;
  rateLimitMax: number;
}

export interface QuantumConfig {
  numQubits: number;
  learningRate: number;
  optimizationLevel: number;
  useQuantumMemory: boolean;
  useQuantumAttention: boolean;
}

export interface ModelConfig {
  path: string;
  version: string;
  maxFeatures: number;
  quantum: QuantumConfig;
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

export interface StorageConfig {
  path: string;
}

export interface SecurityConfig {
  enabled?: boolean;
  apiKey?: string;
  jwtSecret?: string;
  rateLimits?: {
    windowMs: number;
    maxRequests: number;
  };
  cors?: {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
  };
}

export interface BleuConfig {
  core: CoreConfig;
  model: ModelConfig;
  modelPath: string;
  architecture: ModelConfig;
  training: TrainingConfig;
  monitoring: MonitoringConfig;
  storage: StorageConfig;
  security: SecurityConfig;
}

export const DEFAULT_CONFIG: BleuConfig = {
  core: {
    port: 3000,
    environment: 'development',
    logLevel: 'info',
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100
  },
  model: {
    path: 'bleu-ai',
    version: '1.0',
    maxFeatures: 1024,
    quantum: {
      numQubits: 8,
      learningRate: 0.001,
      optimizationLevel: 3,
      useQuantumMemory: true,
      useQuantumAttention: true
    }
  },
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
  },
  storage: {
    path: './storage'
  },
  security: {
    enabled: true,
    apiKey: 'secret-api-key',
    jwtSecret: 'secret-jwt-secret',
    rateLimits: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100
    },
    cors: {
      allowedOrigins: ['http://example.com'],
      allowedMethods: ['GET', 'POST'],
      allowedHeaders: ['Authorization']
    }
  }
};

export interface Config {
  server?: {
    port?: number;
    cors?: {
      allowedOrigins?: string[];
      allowedMethods?: string[];
      allowedHeaders?: string[];
    };
  };
  monitoring?: {
    interval?: number;
    alertThresholds?: {
      errorRate?: { warning: number; critical: number };
      latency?: { warning: number; critical: number };
      memory?: { warning: number; critical: number };
    };
    retentionPeriod?: number;
    maxMetrics?: number;
  };
  security?: {
    enabled?: boolean;
    apiKey?: string;
    jwtSecret?: string;
    rateLimits?: {
      windowMs: number;
      maxRequests: number;
    };
    cors?: {
      allowedOrigins: string[];
      allowedMethods: string[];
      allowedHeaders: string[];
    };
  };
  database?: {
    mongodb?: {
      uri: string;
    };
  };
  models?: {
    path?: string;
    defaultConfig?: {
      batchSize?: number;
      epochs?: number;
      learningRate?: number;
    };
  };
}