import { Tensor, LayersModel } from '@tensorflow/tfjs';
import { HfInference } from '@huggingface/inference';

// Core Types
export interface BleuConfig {
  apiKey: string;
  version: string;
  model: ModelConfig;
  security: SecurityConfig;
  monitoring: MonitoringConfig;
  deployment: DeploymentConfig;
  performance: PerformanceConfig;
}

export interface ModelConfig {
  path: string;
  architecture: {
    type: string;
    layers: number;
    attentionHeads: number;
    hiddenSize: number;
    vocabularySize: number;
    maxSequenceLength: number;
  };
  training: {
    batchSize: number;
    learningRate: number;
    epochs: number;
    warmupSteps: number;
  };
  inference: {
    defaultMaxTokens: number;
    defaultTemperature: number;
    defaultTopP: number;
  };
}

export interface SecurityConfig {
  encryption: {
    algorithm: string;
    keySize: number;
    quantumResistant: boolean;
  };
  authentication: {
    type: string;
    jwtSecret?: string;
    tokenExpiration: number;
  };
  authorization: {
    roles: string[];
    permissions: Record<string, string[]>;
  };
  audit: {
    enabled: boolean;
    logLevel: string;
    retention: number;
  };
}

export interface MonitoringConfig {
  metrics: {
    enabled: boolean;
    interval: number;
    customMetrics: string[];
  };
  logging: {
    level: string;
    format: string;
    destination: string;
  };
  alerts: {
    enabled: boolean;
    thresholds: Record<string, number>;
    channels: string[];
  };
}

export interface DeploymentConfig {
  environment: string;
  region: string;
  scaling: {
    minInstances: number;
    maxInstances: number;
    targetCPUUtilization: number;
  };
  resources: {
    cpu: string;
    memory: string;
    gpu?: string;
  };
}

export interface PerformanceConfig {
  enableGPU: boolean;
  enableTPU: boolean;
  enableDistributedTraining: boolean;
  batchSize: number;
  cacheSize: number;
  optimizations: string[];
}

// Security Types
export interface SecurityScore {
  overall: number;
  encryption: number;
  authentication: number;
  authorization: number;
  compliance: number;
}

export interface SecurityReport {
  timestamp: Date;
  score: SecurityScore;
  vulnerabilities: Vulnerability[];
  recommendations: string[];
}

export interface Vulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
  remediation?: string;
}

// Monitoring Types
export interface MonitoringMetrics {
  cpu: {
    usage: number;
    load: number[];
  };
  memory: {
    used: number;
    total: number;
    heapUsed: number;
    heapTotal: number;
  };
  responseTime: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
  requests: {
    total: number;
    success: number;
    error: number;
    rate: number;
  };
}

// NLP Types
export interface NLPConfig {
  modelVersion: string;
  maxSequenceLength: number;
  batchSize: number;
  temperature: number;
}

export interface NLPOutput {
  text: string;
  sentiment: {
    score: number;
    label: string;
  };
  entities: Array<{
    text: string;
    type: string;
    score: number;
  }>;
  topics: Array<{
    label: string;
    score: number;
  }>;
  summary: string;
  keywords: string[];
}

// Quantum Types
export interface QuantumCircuit {
  numQubits: number;
  gates: QuantumGate[];
  measurements: QuantumMeasurement[];
  initialize(): void;
  addGate(gate: QuantumGate): void;
  measure(): QuantumMeasurement[];
  getState(): number[];
  getDepth(): number;
}

export interface QuantumGate {
  name: string;
  qubits: number[];
  parameters?: number[];
  matrix?: number[][];
}

export interface QuantumMeasurement {
  qubit: number;
  result: number;
  probability: number;
}

// Code Analysis Types
export interface CodeAnalysisConfig {
  language: string;
  rules: string[];
  customRules?: Record<string, any>;
}

export interface CodeAnalysisOutput {
  complexity: number;
  maintainability: number;
  security: {
    vulnerabilities: string[];
    dependencies: string[];
  };
  quality: {
    issues: string[];
    suggestions: string[];
  };
}

// HenFarm Types
export interface HenFarmConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  customization: Record<string, any>;
}

// Multimodal Types
export interface MultimodalConfig {
  models: {
    text: string;
    image: string;
    audio: string;
    video: string;
  };
  fusion: {
    strategy: string;
    weights: Record<string, number>;
  };
}

export interface MultimodalOutput {
  text?: string;
  image?: Buffer;
  audio?: Buffer;
  video?: Buffer;
  confidence: number;
}

// Re-export types
export type { Tensor, LayersModel };

export interface ClusterConfig {
  nodes: string[];
  masterNode: string;
}

export interface SecurityScores {
  encryption: number;
  authentication: number;
  vulnerabilities: number;
  compliance: number;
}

export interface EncryptedData {
  data: string;
  iv: string;
  tag: string;
}

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

export interface CoreConfig {
  maxTokens: number;
  temperature: number;
}

export interface TrainingConfig {
  learningRate: number;
  batchSize: number;
  epochs: number;
  loss: string;
  metrics: string[];
}

export interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  executionTime: number;
  memoryUsage: number;
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
  validationFeatures?: number[][];
  validationLabels?: number[][];
}

export interface ModelState {
  weights: any;
  optimizer: any;
  metrics: ModelMetrics;
  timestamp: string;
}

export interface AIServices {
  hf: HfInference;
  model: LayersModel;
} 