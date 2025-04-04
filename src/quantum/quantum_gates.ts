export interface QuantumGate {
  type: string;
  qubits: number[];
  parameters?: number[];
}

export class HadamardGate implements QuantumGate {
  type = 'H';
  qubits: number[];

  constructor(qubit: number) {
    this.qubits = [qubit];
  }
}

export class CNOTGate implements QuantumGate {
  type = 'CNOT';
  qubits: number[];

  constructor(control: number, target: number) {
    this.qubits = [control, target];
  }
} 