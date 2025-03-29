import { QuantumProcessor } from './quantumProcessor';
import { createLogger } from '../utils/logger';

export interface QuantumEnhancerConfig {
  numQubits: number;
  errorCorrectionEnabled: boolean;
  optimizationLevel: 'low' | 'medium' | 'high';
}

export class QuantumEnhancer {
  private readonly logger = createLogger('QuantumEnhancer');
  private processor: QuantumProcessor;
  private initialized = false;

  constructor(config: QuantumEnhancerConfig) {
    this.processor = new QuantumProcessor({
      numQubits: config.numQubits,
      errorCorrectionEnabled: config.errorCorrectionEnabled,
      optimizationLevel: config.optimizationLevel
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.info('QuantumEnhancer already initialized');
      return;
    }

    try {
      await this.processor.initialize();
      this.initialized = true;
      this.logger.info('QuantumEnhancer initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize QuantumEnhancer:', error);
      throw error;
    }
  }

  async enhance(data: any): Promise<any> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Convert input data to quantum state
      const quantumState = await this.processor.prepareState(data);
      
      // Apply quantum operations
      const enhancedState = await this.processor.process(quantumState);
      
      // Convert back to classical data
      return await this.processor.measure(enhancedState);
    } catch (error) {
      this.logger.error('Failed to enhance data:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      await this.processor.cleanup();
      this.initialized = false;
      this.logger.info('QuantumEnhancer cleaned up successfully');
    } catch (error) {
      this.logger.error('Failed to cleanup QuantumEnhancer:', error);
      throw error;
    }
  }
} 