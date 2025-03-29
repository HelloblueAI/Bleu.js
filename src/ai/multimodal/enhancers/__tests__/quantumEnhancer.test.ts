import { QuantumEnhancer } from '../quantumEnhancer';
import * as tf from '@tensorflow/tfjs-node';
import { Monitor } from '../monitor';
import { Logger } from '../../../../utils/logger';

describe('QuantumEnhancer', () => {
  let enhancer: QuantumEnhancer;
  let monitor: Monitor;
  let logger: Logger;

  beforeEach(async () => {
    logger = new Logger('QuantumEnhancerTest');
    monitor = new Monitor();
    await monitor.initialize();
    
    enhancer = new QuantumEnhancer({ monitor });
    await enhancer.initialize();
  });

  afterEach(async () => {
    await enhancer.cleanup();
    await monitor.cleanup();
  });

  describe('initialization', () => {
    it('should initialize with default configuration', async () => {
      expect(enhancer).toBeDefined();
      const state = enhancer.getState();
      expect(state).toBeDefined();
      expect(state.maxQubits).toBeDefined();
      expect(state.coherenceThreshold).toBeDefined();
    });

    it('should initialize with custom configuration', async () => {
      const config = {
        maxQubits: 4,
        coherenceThreshold: 0.8
      };
      const customEnhancer = new QuantumEnhancer({ ...config, monitor });
      await customEnhancer.initialize();
      
      const state = customEnhancer.getState();
      expect(state.maxQubits).toBe(4);
      expect(state.coherenceThreshold).toBe(0.8);
    });
  });

  describe('quantum operations', () => {
    it('should apply quantum gates correctly', async () => {
      const gate = { type: 'H' as const, target: 0 };
      await enhancer.applyQuantumGate(gate);
      
      // Verify gate application by checking state
      const state = enhancer.getState();
      expect(state.qubits[0].state).toBeDefined();
    });

    it('should handle quantum gate errors', async () => {
      const invalidGate = { type: 'INVALID' as any, target: -1 };
      await expect(enhancer.applyQuantumGate(invalidGate)).rejects.toThrow('Invalid gate type');
    });
  });

  describe('model enhancement', () => {
    let model: tf.LayersModel;

    beforeEach(async () => {
      // Create a simple model for testing
      model = tf.sequential({
        layers: [
          tf.layers.dense({ units: 2, inputShape: [2] }),
          tf.layers.dense({ units: 1 })
        ]
      });
      model.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });
    });

    afterEach(() => {
      model.dispose();
    });

    it('should enhance model with quantum features', async () => {
      const originalWeights = model.getWeights();
      await enhancer.enhanceModel(model);
      const enhancedWeights = model.getWeights();
      
      // Verify weights have been modified
      expect(enhancedWeights).not.toEqual(originalWeights);
      
      // Verify model still works
      const input = tf.tensor2d([[1, 2]]);
      const output = model.predict(input) as tf.Tensor;
      expect(output.shape).toEqual([1, 1]);
      input.dispose();
      output.dispose();
    });

    it('should handle model enhancement errors', async () => {
      const invalidModel = null as any;
      await expect(enhancer.enhanceModel(invalidModel)).rejects.toThrow('Invalid model');
    });
  });

  describe('input enhancement', () => {
    it('should enhance input data', async () => {
      const input = tf.tensor2d([[1, 2], [3, 4]]);
      const enhanced = await enhancer.enhanceInput(input);
      
      expect(enhanced).toBeDefined();
      expect(enhanced.shape).toEqual(input.shape);
      expect(enhanced.dtype).toBe(input.dtype);
      
      // Verify enhancement by checking values are different
      const inputData = await input.data();
      const enhancedData = await enhanced.data();
      expect(enhancedData).not.toEqual(inputData);
      
      input.dispose();
      enhanced.dispose();
    });

    it('should handle invalid input data', async () => {
      const invalidInput = null as any;
      await expect(enhancer.enhanceInput(invalidInput)).rejects.toThrow('Invalid input');
    });
  });

  describe('resource management', () => {
    it('should handle multiple initializations gracefully', async () => {
      await enhancer.initialize();
      const state = enhancer.getState();
      expect(state).toBeDefined();
    });

    it('should throw error when getting state before initialization', () => {
      const uninitializedEnhancer = new QuantumEnhancer({ monitor });
      expect(() => uninitializedEnhancer.getState()).toThrow('QuantumEnhancer not initialized');
    });

    it('should cleanup resources properly', async () => {
      await enhancer.cleanup();
      expect(() => enhancer.getState()).toThrow('QuantumEnhancer not initialized');
    });
  });
}); 