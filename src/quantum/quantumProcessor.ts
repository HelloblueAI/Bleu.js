import { Logger } from '../utils/logger';
import { QuantumError } from '../utils/errors';
import { QuantumCircuit } from './circuit';
import { QuantumGate, GateType } from './gate';
import { Qubit } from './qubit';
import { QuantumState } from './state';
import { ProcessorConfig } from './types';

export class QuantumProcessor {
  private state: QuantumState | null = null;
  private circuit: QuantumCircuit | null = null;
  private config: ProcessorConfig;
  private logger: Logger;

  constructor(config: ProcessorConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing quantum processor');
      this.state = new QuantumState(this.config.numQubits, this.logger);
      this.circuit = new QuantumCircuit({ numQubits: this.config.numQubits }, this.logger);
      this.logger.info('Quantum processor initialized');
    } catch (error) {
      this.logger.error('Failed to initialize quantum processor', error);
      throw error;
    }
  }

  async processCircuit(circuit: QuantumCircuit): Promise<void> {
    try {
      if (!this.state) {
        throw new QuantumError('Quantum processor not initialized');
      }

      this.logger.info('Processing quantum circuit');
      for (const gate of circuit.getGates()) {
        await this.applyGate(gate);
      }
      this.logger.info('Circuit processing completed');
    } catch (error) {
      this.logger.error('Failed to process circuit', error);
      throw error;
    }
  }

  async measure(qubitIndex: number): Promise<number> {
    try {
      if (!this.state) {
        throw new QuantumError('Quantum processor not initialized');
      }

      this.logger.info(`Measuring qubit ${qubitIndex}`);
      const result = await this.state.measure(qubitIndex);
      this.logger.info(`Measurement result: ${result}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to measure qubit', error);
      throw error;
    }
  }

  getState(): QuantumState | null {
    return this.state;
  }

  async reset(): Promise<void> {
    try {
      this.logger.info('Resetting quantum processor');
      if (this.state) {
        await this.state.reset();
      }
      this.logger.info('Quantum processor reset completed');
    } catch (error) {
      this.logger.error('Failed to reset quantum processor', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      this.logger.info('Cleaning up quantum processor');
      if (this.state) {
        await this.state.cleanup();
      }
      this.state = null;
      this.circuit = null;
      this.logger.info('Quantum processor cleanup completed');
    } catch (error) {
      this.logger.error('Failed to cleanup quantum processor', error);
      throw error;
    }
  }

  private async applyGate(gate: QuantumGate): Promise<void> {
    try {
      if (!this.state) {
        throw new QuantumError('Quantum processor not initialized');
      }

      const targetQubit = gate.getTargetQubit();
      const controlQubit = gate.getControlQubit();

      if (gate.getType() === GateType.CNOT) {
        if (controlQubit === undefined) {
          throw new QuantumError('CNOT gate requires a control qubit');
        }
        await this.applyCNOT(controlQubit, targetQubit);
      } else {
        await this.applySingleQubitGate(gate);
      }
    } catch (error) {
      this.logger.error('Failed to apply gate', error);
      throw error;
    }
  }

  private async applySingleQubitGate(gate: QuantumGate): Promise<void> {
    const targetQubit = gate.getTargetQubit();
    const matrix = gate.getMatrix();
    await this.state!.applyUnitary(targetQubit, matrix);
  }

  private async applyCNOT(controlQubit: number, targetQubit: number): Promise<void> {
    await this.state!.applyCNOT(controlQubit, targetQubit);
  }
} 