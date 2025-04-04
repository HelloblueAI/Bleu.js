export interface QuantumState {
  amplitudes: number[];
  phases: number[];
  qubits: number;
}

export class QuantumStateImpl implements QuantumState {
  amplitudes: number[];
  phases: number[];
  qubits: number;

  constructor(qubits: number) {
    this.qubits = qubits;
    this.amplitudes = Array(2 ** qubits).fill(0);
    this.phases = Array(2 ** qubits).fill(0);
  }
} 