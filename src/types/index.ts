export interface NeuralNode {
  id: string;
  type: string;
  activation: string;
  weights: number[];
  bias: number;
  metadata?: Record<string, any>;
}

export interface NeuralConnection {
  sourceId: string;
  targetId: string;
  weight: number;
  enabled: boolean;
  metadata?: Record<string, any>;
}

export interface NeuralNetworkProps {
  nodes: NeuralNode[];
  connections: NeuralConnection[];
  scale?: number;
  speed?: number;
  intensity?: number;
}

export interface NeuronProps {
  position: [number, number, number];
  value: number;
  scale?: number;
}

export interface NeuralConnectionProps {
  from: [number, number, number];
  to: [number, number, number];
  weight: number;
  scale?: number;
}

// Core types
export interface ModelConfig {
  learningRate: number;
  maxDepth?: number;
  numRounds?: number;
  objective?: string;
  quantumEnabled?: boolean;
  deviceType?: 'CPU' | 'GPU' | 'QPU';
}

export interface TrainingData {
  features: number[][];
  labels: number[];
  weights?: number[];
  metadata?: Record<string, any>;
}

export interface PredictionResult {
  prediction: number;
  confidence: number;
  predictions: number[];
  probabilities?: number[][];
  quantumAdvantage?: number;
  quantumState?: QuantumState;
  metadata?: Record<string, any>;
}

// Quantum types
export interface QuantumState {
  amplitudes: number[];
  phases: number[];
  qubits: number;
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

// XGBoost types
export interface XGBoostModel {
  config: ModelConfig;
  trained: boolean;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
}

// Python integration types
export interface PythonResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Core BleuJS Types
export interface BleuJSConfig {
  quantumEnabled: boolean;
  mlEnabled: boolean;
  maxWorkers: number;
  devicePreference?: 'CPU' | 'GPU' | 'QPU';
  debugLevel?: 'error' | 'warn' | 'info' | 'debug';
  autoOptimize?: boolean;
}

export interface OptimizationResult {
  originalScore: number;
  optimizedScore: number;
  improvement: number;
  parameters: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface BleuJSResult {
  success: boolean;
  data: any;
  quantumMetrics?: {
    circuitDepth: number;
    gateCount: number;
    executionTime: number;
    coherenceTime?: number;
  };
  classicalMetrics?: {
    executionTime: number;
    memoryUsage: number;
    cpuUtilization: number;
  };
  metadata?: Record<string, any>;
} 