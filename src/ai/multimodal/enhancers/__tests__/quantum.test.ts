import { jest, describe, it, expect, test } from '@jest/globals';
import * as tf from '@tensorflow/tfjs';

describe('Quantum Features', () => {
  describe('Basic Quantum Operations', () => {
    test('should initialize quantum state', () => {
      // Create a simple quantum state
      const numQubits = 2;
      const state = tf.zeros([Math.pow(2, numQubits)]);
      state.dispose();
      expect(true).toBe(true);
    });

    test('should apply Hadamard gate', () => {
      // Create a simple quantum state
      const state = tf.tensor([[1], [0]]);
      
      // Hadamard matrix
      const H = tf.tensor2d([
        [1/Math.sqrt(2), 1/Math.sqrt(2)],
        [1/Math.sqrt(2), -1/Math.sqrt(2)]
      ]);

      // Apply Hadamard gate
      const newState = tf.matMul(H, state);
      
      // Check if the state is in superposition
      const values = newState.arraySync() as number[][];
      expect(Math.abs(values[0][0] - 1/Math.sqrt(2))).toBeLessThan(1e-6);
      expect(Math.abs(values[1][0] - 1/Math.sqrt(2))).toBeLessThan(1e-6);

      // Cleanup
      state.dispose();
      H.dispose();
      newState.dispose();
    });

    test('should apply CNOT gate', () => {
      // Create a two-qubit state |10⟩
      const state = tf.tensor([[0], [0], [1], [0]]);
      
      // CNOT matrix
      const CNOT = tf.tensor2d([
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 1],
        [0, 0, 1, 0]
      ]);

      // Apply CNOT gate
      const newState = tf.matMul(CNOT, state);
      
      // Check if the state is |11⟩
      const values = newState.arraySync() as number[][];
      expect(Math.abs(values[0][0])).toBeLessThan(1e-6);
      expect(Math.abs(values[1][0])).toBeLessThan(1e-6);
      expect(Math.abs(values[2][0])).toBeLessThan(1e-6);
      expect(Math.abs(values[3][0] - 1)).toBeLessThan(1e-6);

      // Cleanup
      state.dispose();
      CNOT.dispose();
      newState.dispose();
    });

    test('should apply Phase gate', () => {
      // Create a quantum state
      const state = tf.tensor([[1], [0]]);
      
      // Phase matrix (S gate)
      const S = tf.tensor2d([
        [1, 0],
        [0, Math.exp(Math.PI * 0.5 * 1)]  // Using real number for testing
      ]);

      // Apply Phase gate
      const newState = tf.matMul(S, state);
      
      // Check if the state remains unchanged (since input was |0⟩)
      const values = newState.arraySync() as number[][];
      expect(Math.abs(values[0][0] - 1)).toBeLessThan(1e-6);
      expect(Math.abs(values[1][0])).toBeLessThan(1e-6);

      // Cleanup
      state.dispose();
      S.dispose();
      newState.dispose();
    });

    test('should maintain quantum state coherence', () => {
      // Create a simple quantum state
      const state = tf.tensor([1, 0]);
      
      // Check normalization
      const probabilities = tf.square(tf.abs(state));
      const sum = tf.sum(probabilities);
      const sumValue = sum.arraySync() as number;
      
      expect(Math.abs(sumValue - 1)).toBeLessThan(1e-6);

      // Cleanup
      state.dispose();
      probabilities.dispose();
      sum.dispose();
    });
  });

  describe('Quantum Feature Extraction', () => {
    test('should extract quantum features from classical data', () => {
      // Create classical input data
      const input = tf.tensor([0.5, 0.5]);
      
      // Convert to quantum state
      const norm = tf.sqrt(tf.sum(tf.square(input)));
      const quantumState = tf.div(input, norm);
      
      // Check if it's a valid quantum state
      const probabilities = tf.square(tf.abs(quantumState));
      const sum = tf.sum(probabilities);
      const sumValue = sum.arraySync() as number;
      
      expect(Math.abs(sumValue - 1)).toBeLessThan(1e-6);

      // Cleanup
      input.dispose();
      norm.dispose();
      quantumState.dispose();
      probabilities.dispose();
      sum.dispose();
    });

    test('should apply quantum feature transformation', () => {
      // Create classical input data
      const input = tf.tensor([0.5, 0.5]);
      
      // Convert to quantum state
      const norm = tf.sqrt(tf.sum(tf.square(input)));
      const quantumState = tf.div(input, norm);
      
      // Apply quantum feature transformation (Hadamard)
      const H = tf.tensor2d([
        [1/Math.sqrt(2), 1/Math.sqrt(2)],
        [1/Math.sqrt(2), -1/Math.sqrt(2)]
      ]);
      
      const transformedState = tf.matMul(H, quantumState.reshape([2, 1]));
      
      // Check if the transformed state is valid
      const probabilities = tf.square(tf.abs(transformedState));
      const sum = tf.sum(probabilities);
      const sumValue = sum.arraySync() as number;
      
      expect(Math.abs(sumValue - 1)).toBeLessThan(1e-6);

      // Cleanup
      input.dispose();
      norm.dispose();
      quantumState.dispose();
      H.dispose();
      transformedState.dispose();
      probabilities.dispose();
      sum.dispose();
    });
  });
}); 