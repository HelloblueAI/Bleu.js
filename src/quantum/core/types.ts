export interface QuantumState {
  amplitudes: number[];
  phases: number[];
  qubits: number;
  numQubits: number;
}

export interface QuantumGate {
  type: string;
  target: number;
  control?: number;
  parameters?: number[];
}

export interface QuantumCircuit {
  gates: QuantumGate[];
  numQubits: number;
} 