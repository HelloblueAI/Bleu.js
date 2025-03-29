export interface QuantumRegister {
  id: string;
  state: number;  // 0 or 1
  entangled: boolean;
  errorRate: number;
  connectedQubits?: string[];
}

export interface QuantumGate {
  type: 'H' | 'X' | 'Y' | 'Z' | 'CNOT' | 'SWAP' | 'TOFFOLI';
  target: number;
  control?: number;
  parameters?: Record<string, number>;
  errorRate?: number;
  duration?: number;
}

export interface QuantumState {
  qubits: Qubit[];
  entanglement: Map<string, number>;  // Maps qubit pairs to entanglement strength
  errorRates: Map<string, number>;     // Maps qubit IDs to error rates
  globalPhase?: number;
  densityMatrix?: number[][];
}

export interface QuantumMeasurement {
  qubit: number;
  basis: 'computational' | 'hadamard' | 'phase';
  result: number;
  timestamp: number;
  errorRate: number;
}

export interface QuantumError {
  type: 'decoherence' | 'gate' | 'measurement' | 'initialization';
  qubit: number;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
  details: Record<string, any>;
}

export interface QuantumCircuitMetrics {
  depth: number;
  width: number;
  numGates: number;
  entanglementDepth: number;
  fidelity: number;
  errorRate: number;
  coherenceTime: number;
}

export interface QuantumOptimizationResult {
  originalCircuit: QuantumCircuit;
  optimizedCircuit: QuantumCircuit;
  improvement: {
    gateCount: number;
    depth: number;
    executionTime: number;
  };
  metadata: Record<string, any>;
}

export interface QuantumAlgorithm {
  name: string;
  type: 'VQE' | 'QAOA' | 'QNN' | 'Grover' | 'Shor';
  parameters: {
    iterations: number;
    convergenceThreshold: number;
    optimizationMethod: string;
    [key: string]: any;
  };
  circuit: QuantumCircuit;
}

export interface QuantumMemoryCell {
  address: number;
  value: Float32Array;
  coherenceTime: number;
  entangledWith?: number[];
}

export interface QuantumRegisterState {
  register: QuantumRegister;
  amplitude: Complex;
  phase: number;
  probability: number;
}

/**
 * Represents a complex number.
 */
export interface Complex {
  real: number;
  imag: number;
}

export interface QuantumGateSet {
  single: {
    hadamard: QuantumGate;
    pauliX: QuantumGate;
    pauliY: QuantumGate;
    pauliZ: QuantumGate;
    phase: QuantumGate;
    rotation: (angle: number) => QuantumGate;
  };
  multi: {
    cnot: QuantumGate;
    swap: QuantumGate;
    toffoli: QuantumGate;
    fredkin: QuantumGate;
  };
  custom: {
    controlled: (gate: QuantumGate) => QuantumGate;
    tensor: (gates: QuantumGate[]) => QuantumGate;
    inverse: (gate: QuantumGate) => QuantumGate;
  };
}

export interface QuantumCircuit {
  gates: QuantumGate[];
  measurements: number[];
  optimization: {
    depth: number;
    fidelity: number;
    noise: number;
    errorCorrection: boolean;
  };
  addGate(gate: QuantumGate): void;
  optimize(): Promise<void>;
  cleanup(): Promise<void>;
}

export function Complex(real: number, imag: number = 0): Complex {
  return { real, imag };
}

export interface QuantumOperation {
  name: string;
  matrix: number[][];
  numQubits: number;
  description: string;
}

/**
 * Configuration for the quantum processor.
 */
export interface ProcessorConfig {
  numQubits: number;
  errorCorrection: boolean;
  noiseModel?: NoiseModel;
  optimizationLevel: number;
  maxGateDepth?: number;
  backend: 'simulator' | 'hardware';
}

/**
 * Represents different types of quantum noise.
 */
export interface NoiseModel {
  depolarizing: number;
  amplitude: number;
  phase: number;
  measurement: number;
}

/**
 * Result of a quantum computation.
 */
export interface QuantumResult {
  measurements: number[];
  probabilities: number[];
  fidelity: number;
  executionTime: number;
  errorRate?: number;
}

/**
 * Statistics about quantum circuit execution.
 */
export interface CircuitStats {
  depth: number;
  gateCount: number;
  qubitCount: number;
  classicalBits: number;
  executionTime: number;
}

/**
 * Options for quantum circuit optimization.
 */
export interface OptimizationOptions {
  removeRedundant: boolean;
  combineRotations: boolean;
  reorderGates: boolean;
  useTemplates: boolean;
  maxIterations?: number;
}

/**
 * Result of circuit optimization.
 */
export interface OptimizationResult {
  originalDepth: number;
  optimizedDepth: number;
  gateReduction: number;
  fidelityChange: number;
  timeReduction: number;
}

export interface Qubit {
  state: [number, number];  // Complex amplitudes [|0⟩, |1⟩]
  errorRate: number;
  coherence: number;
  lastMeasurement?: number;
  entanglement?: number;
}

export interface QuantumOptimization {
  target: 'fidelity' | 'depth' | 'error_rate';
  constraints: {
    maxDepth?: number;
    minFidelity?: number;
    maxErrorRate?: number;
  };
  algorithm: 'greedy' | 'genetic' | 'annealing';
  parameters: Record<string, number>;
}

export interface QuantumBackend {
  name: 'simulator' | 'ibm' | 'ionq';
  capabilities: {
    maxQubits: number;
    gateTypes: string[];
    errorRates: Record<string, number>;
    coherenceTime: number;
  };
  constraints: {
    maxCircuitDepth: number;
    maxGatesPerQubit: number;
    minCoherence: number;
  };
  metrics: {
    fidelity: number;
    errorRate: number;
    executionTime: number;
  };
} 