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
}

export interface QuantumGate {
  type: string;
  qubits: number[];
  parameters?: number[];
}

export interface QuantumCircuit {
  gates: QuantumGate[];
  numQubits: number;
  execute?: () => any;
} 