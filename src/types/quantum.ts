export interface QuantumGate {
  type: 'H' | 'X' | 'Y' | 'Z' | 'CNOT' | 'SWAP' | 'TOFFOLI';
  target: number;
  control?: number;
  control2?: number;
  target2?: number;
  parameters?: Record<string, number>;
}

export interface QuantumCircuit {
  numQubits: number;
  gates: QuantumGate[];
  metadata?: {
    name?: string;
    description?: string;
    optimizationLevel?: number;
    errorCorrection?: boolean;
  };
}

export interface QuantumState {
  numQubits: number;
  amplitudes: number[];
  gates: QuantumGate[];
  entanglement: Map<string, number>;
  errorRates: Map<string, number>;
  metadata?: {
    coherence?: number;
    fidelity?: number;
    timestamp?: number;
  };
}

export class QuantumError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuantumError';
  }
}

export interface QuantumMeasurement {
  qubit: number;
  value: number;
  timestamp: number;
  confidence: number;
}

export interface QuantumOptimizationResult {
  originalGates: number;
  optimizedGates: number;
  depth: number;
  errorRate: number;
  executionTime: number;
}

export interface QuantumEntanglementMetrics {
  averageEntanglement: number;
  maxEntanglement: number;
  coherence: number;
  decoherenceRate: number;
}

export interface QuantumErrorCorrectionStats {
  errorRate: number;
  correctionRate: number;
  syndromeCount: number;
  recoveryAttempts: number;
}

export interface QuantumProcessorConfig {
  maxQubits: number;
  errorCorrection: boolean;
  optimizationLevel: number;
  entanglementStrength: number;
  coherenceThreshold: number;
  noiseModel: {
    depolarizing: number;
    dephasing: number;
    amplitudeDamping: number;
  };
}

export interface QuantumSimulationResult {
  finalState: QuantumState;
  measurements: QuantumMeasurement[];
  optimization: QuantumOptimizationResult;
  entanglement: QuantumEntanglementMetrics;
  errorCorrection: QuantumErrorCorrectionStats;
  executionTime: number;
  success: boolean;
  error?: string;
} 