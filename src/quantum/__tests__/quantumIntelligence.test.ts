import { QuantumProcessor } from '../processor';
import { QuantumGate, QuantumBackend } from '../types';
import { Logger } from '../../utils/logger';
import { Monitor } from '../../ai/multimodal/enhancers/monitor';

describe('Quantum Intelligence', () => {
  let processor: QuantumProcessor;
  let logger: Logger;
  let monitor: Monitor;
  let backend: QuantumBackend;

  beforeEach(async () => {
    logger = new Logger('QuantumIntelligenceTest');
    monitor = new Monitor();
    await monitor.initialize();

    backend = {
      name: 'simulator',
      capabilities: {
        maxQubits: 8,
        gateTypes: ['H', 'X', 'Y', 'Z', 'CNOT', 'SWAP', 'TOFFOLI'],
        errorRates: {},
        coherenceTime: 1000
      },
      constraints: {
        maxCircuitDepth: 100,
        maxGatesPerQubit: 1000,
        minCoherence: 0.8
      },
      metrics: {
        fidelity: 0.99,
        errorRate: 0.01,
        executionTime: 0
      }
    };

    processor = new QuantumProcessor({
      maxQubits: 4,
      backend,
      errorCorrection: true,
      optimizationLevel: 'optimal'
    });

    await processor.initialize();
  });

  afterEach(async () => {
    await processor.cleanup();
    await monitor.cleanup();
  });

  describe('Quantum Superposition', () => {
    it('should create and maintain superposition states', async () => {
      // Create superposition using Hadamard gate
      await processor.applyGate({ type: 'H', target: 0 });
      
      const state = processor.getState();
      const qubit = state.qubits[0];
      
      // Verify superposition state
      expect(Math.abs(qubit.state[0])).toBeCloseTo(1 / Math.sqrt(2), 6);
      expect(Math.abs(qubit.state[1])).toBeCloseTo(1 / Math.sqrt(2), 6);
      
      // Verify coherence is maintained
      expect(qubit.coherence).toBeGreaterThan(0.9);
    });

    it('should handle multiple qubit superposition', async () => {
      // Create superposition on multiple qubits
      await processor.applyGate({ type: 'H', target: 0 });
      await processor.applyGate({ type: 'H', target: 1 });
      
      const state = processor.getState();
      
      // Verify both qubits are in superposition
      expect(Math.abs(state.qubits[0].state[0])).toBeCloseTo(1 / Math.sqrt(2), 6);
      expect(Math.abs(state.qubits[1].state[0])).toBeCloseTo(1 / Math.sqrt(2), 6);
    });
  });

  describe('Quantum Entanglement', () => {
    it('should create and maintain entangled states', async () => {
      // Create Bell state using Hadamard and CNOT
      await processor.applyGate({ type: 'H', target: 1 });
      await processor.applyGate({ type: 'CNOT', target: 1, control: 0 });
      
      const state = processor.getState();
      
      // Verify entanglement
      expect(state.entanglement.get('0,1')).toBeGreaterThan(0.8);
    });

    it('should maintain entanglement under operations', async () => {
      // Create entangled state
      await processor.applyGate({ type: 'H', target: 1 });
      await processor.applyGate({ type: 'CNOT', target: 1, control: 0 });
      
      // Apply operations that preserve entanglement
      await processor.applyGate({ type: 'X', target: 0 });
      
      const state = processor.getState();
      expect(state.entanglement.get('0,1')).toBeGreaterThan(0.8);
    });
  });

  describe('Quantum Error Correction', () => {
    it('should detect and correct quantum errors', async () => {
      // Apply gate with high error rate
      await processor.applyGate({ 
        type: 'X', 
        target: 0,
        errorRate: 0.2
      });
      
      const state = processor.getState();
      expect(state.qubits[0].errorRate).toBeLessThan(0.2);
    });

    it('should maintain state fidelity under errors', async () => {
      // Create superposition
      await processor.applyGate({ type: 'H', target: 0 });
      
      // Apply noisy operations
      for (let i = 0; i < 5; i++) {
        await processor.applyGate({ 
          type: 'X', 
          target: 0,
          errorRate: 0.1
        });
      }
      
      const state = processor.getState();
      expect(state.qubits[0].coherence).toBeGreaterThan(0.8);
    });
  });

  describe('Quantum Measurement', () => {
    it('should perform measurements in different bases', async () => {
      // Prepare state
      await processor.applyGate({ type: 'H', target: 0 });
      
      // Measure in different bases
      const results = await Promise.all([
        processor.measure(0, 'computational'),
        processor.measure(0, 'hadamard'),
        processor.measure(0, 'phase')
      ]);
      
      // Verify measurements are valid
      results.forEach(result => {
        expect([0, 1]).toContain(result);
      });
    });

    it('should maintain measurement statistics', async () => {
      // Prepare state
      await processor.applyGate({ type: 'H', target: 0 });
      
      // Perform multiple measurements
      const measurements = [];
      for (let i = 0; i < 100; i++) {
        measurements.push(await processor.measure(0));
      }
      
      // Verify approximately 50/50 distribution
      const ones = measurements.filter(m => m === 1).length;
      expect(Math.abs(ones - 50)).toBeLessThan(20);
    });
  });

  describe('Quantum Circuit Optimization', () => {
    it('should optimize quantum circuits', async () => {
      // Create a complex circuit
      await processor.applyGate({ type: 'H', target: 0 });
      await processor.applyGate({ type: 'X', target: 1 });
      await processor.applyGate({ type: 'CNOT', target: 1, control: 0 });
      await processor.applyGate({ type: 'Z', target: 2 });
      
      // Optimize circuit
      await processor.optimize();
      
      const state = processor.getState();
      expect(state.qubits[0].coherence).toBeGreaterThan(0.8);
    });

    it('should maintain circuit fidelity during optimization', async () => {
      // Create initial state
      await processor.applyGate({ type: 'H', target: 0 });
      const initialState = processor.getState();
      
      // Apply and optimize complex circuit
      await processor.applyGate({ type: 'X', target: 1 });
      await processor.applyGate({ type: 'CNOT', target: 1, control: 0 });
      await processor.optimize();
      
      const finalState = processor.getState();
      expect(Math.abs(finalState.qubits[0].state[0] - initialState.qubits[0].state[0])).toBeLessThan(0.1);
    });
  });

  describe('Quantum Intelligence Features', () => {
    it('should maintain quantum state coherence', async () => {
      // Create complex quantum state
      await processor.applyGate({ type: 'H', target: 0 });
      await processor.applyGate({ type: 'CNOT', target: 1, control: 0 });
      await processor.applyGate({ type: 'H', target: 2 });
      
      // Apply multiple operations
      for (let i = 0; i < 10; i++) {
        await processor.applyGate({ type: 'X', target: 0 });
      }
      
      const state = processor.getState();
      state.qubits.forEach(qubit => {
        expect(qubit.coherence).toBeGreaterThan(0.8);
      });
    });

    it('should handle quantum state transitions', async () => {
      // Create initial state
      await processor.applyGate({ type: 'H', target: 0 });
      
      // Apply sequence of gates
      const gates: QuantumGate[] = [
        { type: 'X', target: 0 },
        { type: 'Y', target: 0 },
        { type: 'Z', target: 0 }
      ];
      
      for (const gate of gates) {
        await processor.applyGate(gate);
      }
      
      const state = processor.getState();
      expect(state.qubits[0].coherence).toBeGreaterThan(0.8);
    });
  });
}); 