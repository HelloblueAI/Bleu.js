export interface ModelConfig {
  learningRate: number;
  maxDepth: number;
  numRounds: number;
  [key: string]: any;
}

export interface TrainingData {
  features: number[][];
  labels: number[];
}

export interface PredictionResult {
  prediction: number;
  confidence: number;
  predictions: number[];
  probabilities?: number[][];
  quantumState?: QuantumState;
}

export interface OptimizationResult {
  bestConfig: ModelConfig;
  bestScore: number;
  history: {
    config: ModelConfig;
    score: number;
  }[];
  originalScore?: number;
  optimizedScore?: number;
  improvement?: number;
  parameters?: any;
  metadata?: any;
}

export interface QuantumState {
  amplitudes: number[];
  phases: number[];
  numQubits: number;
  metadata?: Record<string, any>;
}

export interface QuantumGate {
  type: string;
  target: number;
  control?: number;
  parameters?: number[];
  description?: string;
}

export interface QuantumCircuit {
  gates: QuantumGate[];
  numQubits: number;
  name?: string;
  description?: string;
  execute(): Promise<any>;
} 