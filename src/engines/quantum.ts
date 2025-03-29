import { Logger } from '../utils/logger';
import { QuantumEngineConfig } from '../types/config';
import { QuantumError } from '../types/errors';
import { QuantumProcessor } from '../quantum/quantumProcessor';
import { QuantumCircuit, QuantumState } from '../types/quantum';

export class QuantumEngine {
  private logger: Logger;
  private config: QuantumEngineConfig;
  private processor: QuantumProcessor;
  private initialized: boolean = false;

  constructor(config: QuantumEngineConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.processor = new QuantumProcessor(logger);
  }

  async initialize(): Promise<void> {
    try {
      // Initialize quantum processor
      await this.processor.initialize();

      // Validate configuration
      if (!this.config.maxQubits) {
        throw new QuantumError('Maximum number of qubits not specified');
      }

      this.initialized = true;
      this.logger.info('Quantum engine initialized');
    } catch (error) {
      this.logger.error('Failed to initialize quantum engine', error);
      throw new QuantumError('Failed to initialize quantum engine');
    }
  }

  async processCircuit(circuit: QuantumCircuit): Promise<QuantumState> {
    if (!this.initialized) {
      throw new QuantumError('Quantum engine not initialized');
    }

    try {
      // Validate circuit
      if (circuit.numQubits > this.config.maxQubits) {
        throw new QuantumError(`Circuit requires more qubits than maximum allowed (${this.config.maxQubits})`);
      }

      // Process circuit
      await this.processor.processCircuit(circuit);
      const state = this.processor.getState();
      
      if (!state) {
        throw new QuantumError('Failed to process quantum circuit');
      }

      return state;
    } catch (error) {
      this.logger.error('Failed to process quantum circuit', error);
      throw new QuantumError('Failed to process quantum circuit');
    }
  }

  async measure(qubit: number): Promise<number> {
    if (!this.initialized) {
      throw new QuantumError('Quantum engine not initialized');
    }

    try {
      return this.processor.measure(qubit);
    } catch (error) {
      this.logger.error('Failed to measure qubit', error);
      throw new QuantumError('Failed to measure qubit');
    }
  }

  async getState(): Promise<QuantumState | null> {
    if (!this.initialized) {
      throw new QuantumError('Quantum engine not initialized');
    }

    return this.processor.getState();
  }

  async reset(): Promise<void> {
    if (!this.initialized) {
      throw new QuantumError('Quantum engine not initialized');
    }

    try {
      this.processor.reset();
      this.logger.info('Quantum engine reset');
    } catch (error) {
      this.logger.error('Failed to reset quantum engine', error);
      throw new QuantumError('Failed to reset quantum engine');
    }
  }

  async cleanup(): Promise<void> {
    try {
      await this.processor.cleanup();
      this.initialized = false;
      this.logger.info('Quantum engine cleaned up');
    } catch (error) {
      this.logger.error('Failed to cleanup quantum engine', error);
      throw new QuantumError('Failed to cleanup quantum engine');
    }
  }
} 