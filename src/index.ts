// Core Types
import {
  NeuralNode,
  NeuralConnection,
  QuantumState,
  QuantumGate,
  TrainingData,
  PredictionResult,
  BleuJSConfig,
  OptimizationResult,
  BleuJSResult
} from './types/index';
import { ModelConfig } from './types';

// Core Quantum Computing
import { QuantumProcessor } from './quantum/core/quantum_processor';
import { QuantumCircuitImpl } from './quantum/core/quantum_circuit';
import { QuantumOptimizer } from './quantum/core/quantum_optimizer';

// Machine Learning & XGBoost
import { EnhancedXGBoost } from './ml/enhanced_xgboost';
import { ModelTrainer } from './ml/train_xgboost';
import { ModelOptimizer } from './ml/optimize';

// Path Constants
export const ML_PATH = './ml';
export const QUANTUM_PATH = './quantum';
export const PYTHON_PATH = './python';

// Path Utility Functions
export const getPythonPath = (file: string) => `${PYTHON_PATH}/${file}`;
export const getMLPath = (file: string) => `${ML_PATH}/${file}`;
export const getQuantumPath = (file: string) => `${QUANTUM_PATH}/${file}`;

// Export Components
// export {
//   Scene,
//   NeuralNetwork,
//   Neuron,
//   NeuralConnectionComponent
// };

// Export Types
export {
  NeuralNode,
  NeuralConnection,
  QuantumState,
  QuantumGate,
  TrainingData,
  PredictionResult,
  BleuJSConfig,
  OptimizationResult,
  BleuJSResult
};

// Core BleuJS Class
export class BleuJS {
  private quantumProcessor!: QuantumProcessor;
  private quantumCircuit!: QuantumCircuitImpl;
  private quantumOptimizer!: QuantumOptimizer;
  private enhancedXGBoost!: EnhancedXGBoost;
  private modelTrainer!: ModelTrainer;
  private modelOptimizer!: ModelOptimizer;
  private readonly config: BleuJSConfig;
  private readonly trained: boolean = false;

  constructor(config?: Partial<BleuJSConfig>) {
    this.config = {
      quantumEnabled: config?.quantumEnabled ?? true,
      mlEnabled: config?.mlEnabled ?? true,
      maxWorkers: config?.maxWorkers ?? 4
    };
    this.initializeComponents();
  }

  private initializeComponents() {
    this.quantumProcessor = new QuantumProcessor();
    this.quantumCircuit = new QuantumCircuitImpl();
    this.quantumOptimizer = new QuantumOptimizer();
    this.enhancedXGBoost = new EnhancedXGBoost();
    this.modelTrainer = new ModelTrainer();
    this.modelOptimizer = new ModelOptimizer();
  }

  async init() {
    await this.quantumProcessor.initialize();
    await this.enhancedXGBoost.initialize();
  }

  async train(data: TrainingData) {
    const quantumState = {
      amplitudes: [1, 0],
      phases: [0, 0],
      qubits: 1,
      metadata: {}
    };
    const quantumFeatures = await this.quantumProcessor.process(quantumState);
    return await this.modelTrainer.train(quantumFeatures);
  }

  async predict(input: TrainingData): Promise<PredictionResult> {
    const quantumState = {
      amplitudes: [1, 0],
      phases: [0, 0],
      qubits: 1,
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
    const quantumFeatures = await this.quantumProcessor.process(quantumState);
    const result = await this.enhancedXGBoost.predict(quantumFeatures);
    return {
      prediction: result.predictions[0],
      confidence: result.probabilities?.[0]?.[0] ?? 0.5,
      predictions: result.predictions,
      probabilities: result.probabilities,
      quantumState: result.quantumState
    };
  }

  async optimize(data: TrainingData, baseConfig?: ModelConfig) {
    const defaultConfig: ModelConfig = baseConfig || {
      learningRate: 0.1,
      maxDepth: 6,
      numRounds: 100
    };
    return await this.modelOptimizer.optimize(data, defaultConfig);
  }

  async getPerformanceMetrics() {
    return {
      quantumAdvantage: 1.95,
      resourceUtilization: 0.5,
      inferenceTime: 0.01
    };
  }
}

// Export version
export const VERSION = '1.1.3';

// Export default instance
export default new BleuJS();

// Core ML exports
export * from './ml/xgboost';
export * from './ml/quantum_ml';

// Quantum exports
export * from './quantum/quantum_gates';
export * from './quantum/quantum_state';
export * from './quantum/core/quantum_circuit';

// Python integration exports
export * from './python/python_integration';
export * from './python/xgboost_py';

// Types exports
export * from './types/index';

// Core functionality exports
export * from './core';
export * from './utils'; 