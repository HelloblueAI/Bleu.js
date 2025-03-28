import { QuantumCircuit, QuantumGate, QuantumMeasurement } from '../types';
import { QuantumOptimizer } from './optimizer';
import { QuantumFeatureExtractor } from './featureExtractor';
import { QuantumStateManager } from './stateManager';
import { QuantumNoiseHandler } from './noiseHandler';
import { QuantumEntanglementManager } from './entanglementManager';
import { logger } from '../utils/logger';

export class QuantumProcessor {
  private optimizer: QuantumOptimizer;
  private featureExtractor: QuantumFeatureExtractor;
  private stateManager: QuantumStateManager;
  private noiseHandler: QuantumNoiseHandler;
  private entanglementManager: QuantumEntanglementManager;
  private metrics: {
    circuitDepth: number;
    entanglementEntropy: number;
    noiseLevel: number;
    optimizationScore: number;
    featureQuality: number;
    statePurity: number;
  };

  constructor() {
    this.optimizer = new QuantumOptimizer();
    this.featureExtractor = new QuantumFeatureExtractor();
    this.stateManager = new QuantumStateManager();
    this.noiseHandler = new QuantumNoiseHandler();
    this.entanglementManager = new QuantumEntanglementManager();
    this.metrics = {
      circuitDepth: 0,
      entanglementEntropy: 0,
      noiseLevel: 0,
      optimizationScore: 0,
      featureQuality: 0,
      statePurity: 0
    };
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Quantum Processor with advanced features...');
    
    await Promise.all([
      this.optimizer.initialize(),
      this.featureExtractor.initialize(),
      this.stateManager.initialize(),
      this.noiseHandler.initialize(),
      this.entanglementManager.initialize()
    ]);

    logger.info('✅ Quantum Processor initialized successfully');
  }

  async createCircuit(numQubits: number): Promise<QuantumCircuit> {
    return {
      numQubits,
      gates: [],
      measurements: [],
      initialize: () => {
        this.stateManager.initializeState(numQubits);
      },
      addGate: (gate: QuantumGate) => {
        this.stateManager.applyGate(gate);
      },
      measure: (): QuantumMeasurement[] => {
        return this.stateManager.measure();
      },
      getState: (): number[] => {
        return this.stateManager.getState();
      },
      getDepth: (): number => {
        return this.stateManager.getCircuitDepth();
      }
    };
  }

  async optimizeCircuit(circuit: QuantumCircuit): Promise<QuantumCircuit> {
    return this.optimizer.optimize(circuit);
  }

  async extractFeatures(data: any): Promise<number[]> {
    return this.featureExtractor.extract(data);
  }

  async handleNoise(measurements: QuantumMeasurement[]): Promise<QuantumMeasurement[]> {
    return this.noiseHandler.handle(measurements);
  }

  async createEntanglement(qubit1: number, qubit2: number): Promise<void> {
    await this.entanglementManager.create(qubit1, qubit2);
  }

  async measureEntanglement(qubit1: number, qubit2: number): Promise<number> {
    return this.entanglementManager.measure(qubit1, qubit2);
  }

  private updateMetrics(): void {
    this.metrics = {
      circuitDepth: this.stateManager.getCircuitDepth(),
      entanglementEntropy: this.entanglementManager.getEntropy(),
      noiseLevel: this.noiseHandler.getNoiseLevel(),
      optimizationScore: this.optimizer.getScore(),
      featureQuality: this.featureExtractor.getQuality(),
      statePurity: this.stateManager.getPurity()
    };
  }

  getMetrics(): typeof this.metrics {
    return this.metrics;
  }

  async dispose(): Promise<void> {
    await Promise.all([
      this.optimizer.dispose(),
      this.featureExtractor.dispose(),
      this.stateManager.dispose(),
      this.noiseHandler.dispose(),
      this.entanglementManager.dispose()
    ]);
  }
} 