import { QuantumCircuit, QuantumGate, QuantumState } from '../../types/index';

export class QuantumCircuitImpl implements QuantumCircuit {
  gates: QuantumGate[] = [];
  numQubits: number;
  name?: string;
  description?: string;

  constructor(numQubits: number = 2, name?: string, description?: string) {
    this.numQubits = numQubits;
    this.name = name;
    this.description = description;
  }

  addGate(gate: QuantumGate): void {
    if (gate.target >= this.numQubits) {
      throw new Error(`Invalid target qubit ${gate.target} for circuit with ${this.numQubits} qubits`);
    }
    if (gate.control !== undefined && gate.control >= this.numQubits) {
      throw new Error(`Invalid control qubit ${gate.control} for circuit with ${this.numQubits} qubits`);
    }
    this.gates.push(gate);
  }

  removeGate(index: number): void {
    if (index >= 0 && index < this.gates.length) {
      this.gates.splice(index, 1);
    }
  }

  clear(): void {
    this.gates = [];
  }

  execute(): Promise<QuantumState> {
    return new Promise((resolve) => {
      // Initialize quantum state
      const state: QuantumState = {
        amplitudes: Array(2 ** this.numQubits).fill(0),
        phases: Array(2 ** this.numQubits).fill(0),
        qubits: this.numQubits,
        metadata: {
          circuitName: this.name,
          gateCount: this.gates.length,
          executionTimestamp: new Date().toISOString()
        }
      };

      // Set initial state |0...0⟩
      state.amplitudes[0] = 1;

      // In a real quantum computer, we would apply gates here
      // For now, we'll just return the initial state
      resolve(state);
    });
  }

  validate(): boolean {
    return this.gates.every(gate => {
      const validTarget = gate.target < this.numQubits;
      const validControl = gate.control === undefined || gate.control < this.numQubits;
      return validTarget && validControl;
    });
  }

  toString(): string {
    const description = this.description ? 'Description: ' + this.description : '';
    return `Quantum Circuit "${this.name ?? 'unnamed'}"
    Number of qubits: ${this.numQubits}
    Number of gates: ${this.gates.length}
    ${description}`;
  }
} 