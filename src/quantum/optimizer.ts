import { Logger } from '../utils/logger';
import { QuantumCircuit } from './circuit';
import { QuantumGate, GateType } from './gate';
import { QuantumError } from '../utils/errors';

export class QuantumOptimizer {
  private logger: Logger;

  constructor(logger: Logger) {
    if (!logger) {
      throw new QuantumError('Logger is required for QuantumOptimizer');
    }
    this.logger = logger;
  }

  optimizeCircuit(circuit: QuantumCircuit): QuantumCircuit {
    this.logger.debug('Starting circuit optimization');

    try {
      if (!circuit) {
        throw new QuantumError('Invalid circuit for optimization');
      }

      const optimizedCircuit = new QuantumCircuit({ numQubits: circuit.getNumQubits() }, this.logger);
      const gates = circuit.getGates();
      const optimizedGates: QuantumGate[] = [];

      // Remove redundant gates
      for (let i = 0; i < gates.length; i++) {
        const currentGate = gates[i];
        const nextGate = gates[i + 1];

        if (nextGate && 
            currentGate.getType() === nextGate.getType() && 
            currentGate.getTargetQubit() === nextGate.getTargetQubit() &&
            !currentGate.getControlQubit() && !nextGate.getControlQubit()) {
          // Skip both gates as they cancel each other
          i++;
          continue;
        }

        optimizedGates.push(currentGate);
      }

      // Optimize gate order for better execution
      const reorderedGates = this.reorderGates(optimizedGates);

      // Add optimized gates to new circuit
      for (const gate of reorderedGates) {
        optimizedCircuit.addGate({
          type: gate.getType(),
          targetQubit: gate.getTargetQubit(),
          controlQubit: gate.getControlQubit()
        });
      }

      this.logger.debug('Circuit optimization completed');
      return optimizedCircuit;
    } catch (error) {
      this.logger.error('Failed to optimize circuit', error);
      throw error;
    }
  }

  private reorderGates(gates: QuantumGate[]): QuantumGate[] {
    const reordered: QuantumGate[] = [];
    const usedQubits = new Set<number>();

    for (const gate of gates) {
      const targetQubit = gate.getTargetQubit();
      const controlQubit = gate.getControlQubit();

      if (gate.getType() === GateType.CNOT) {
        // CNOT gates should be executed after single-qubit gates
        reordered.push(gate);
        usedQubits.add(targetQubit);
        if (controlQubit !== undefined) {
          usedQubits.add(controlQubit);
        }
      } else {
        // Single-qubit gates can be executed in parallel if they don't share qubits
        if (!usedQubits.has(targetQubit)) {
          reordered.unshift(gate);
          usedQubits.add(targetQubit);
        } else {
          reordered.push(gate);
        }
      }
    }

    return reordered;
  }

  async cleanup(): Promise<void> {
    try {
      this.logger.info('Cleaning up quantum optimizer');
      this.logger.info('Quantum optimizer cleanup completed');
    } catch (error) {
      this.logger.error('Failed to cleanup quantum optimizer', error);
      throw error;
    }
  }
} 