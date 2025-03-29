import { QuantumProcessor } from '../processor';
import { QuantumGate, QuantumBackend } from '../types';
import { Logger } from '../../utils/logger';
import { Monitor } from '../../ai/multimodal/enhancers/monitor';

describe('QuantumProcessor', () => {
  let processor: QuantumProcessor;
  let logger: Logger;
  let monitor: Monitor;
  let backend: QuantumBackend;

  beforeEach(async () => {
    logger = new Logger('QuantumProcessorTest');
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

  describe('initialization', () => {
    it('should initialize with default configuration', async () => {
      const defaultProcessor = new QuantumProcessor({
        maxQubits: 4,
        backend,
        errorCorrection: true,
        optimizationLevel: 'optimal'
      });
      await defaultProcessor.initialize();
      
      const state = defaultProcessor.getState();
      expect(state).toBeDefined();
      expect(state.qubits.length).toBe(4);
      expect(state.qubits[0].state).toEqual([1, 0]);
      expect(state.qubits[0].coherence).toBe(1.0);
    });

    it('should initialize with custom configuration', async () => {
      const customProcessor = new QuantumProcessor({
        maxQubits: 2,
        backend: {
          ...backend,
          capabilities: {
            ...backend.capabilities,
            maxQubits: 2
          }
        },
        errorCorrection: false,
        optimizationLevel: 'basic'
      });
      await customProcessor.initialize();
      
      const state = customProcessor.getState();
      expect(state.qubits.length).toBe(2);
    });

    it('should handle initialization failure', async () => {
      const invalidProcessor = new QuantumProcessor({
        maxQubits: -1,
        backend,
        errorCorrection: true,
        optimizationLevel: 'optimal'
      });
      await expect(invalidProcessor.initialize()).rejects.toThrow('Failed to initialize QuantumProcessor');
    });
  });

  describe('quantum operations', () => {
    it('should apply quantum gates correctly', async () => {
      const gate: QuantumGate = {
        type: 'H',
        target: 0
      };
      await processor.applyGate(gate);
      
      const state = processor.getState();
      expect(state.qubits[0].state).toBeDefined();
      expect(Math.abs(state.qubits[0].state[0])).toBeCloseTo(1 / Math.sqrt(2), 6);
      expect(Math.abs(state.qubits[0].state[1])).toBeCloseTo(1 / Math.sqrt(2), 6);
    });

    it('should handle quantum gate errors', async () => {
      const invalidGate: QuantumGate = {
        type: 'INVALID' as any,
        target: -1
      };
      await expect(processor.applyGate(invalidGate)).rejects.toThrow('Invalid gate type');
    });

    it('should apply error correction when enabled', async () => {
      const gate: QuantumGate = {
        type: 'X',
        target: 0,
        errorRate: 0.2
      };
      await processor.applyGate(gate);
      
      const state = processor.getState();
      expect(state.qubits[0].errorRate).toBeLessThan(0.2);
    });
  });

  describe('measurements', () => {
    it('should perform measurements in different bases', async () => {
      // Prepare state with Hadamard gate
      await processor.applyGate({ type: 'H', target: 0 });
      
      // Measure in computational basis
      const result1 = await processor.measure(0, 'computational');
      expect([0, 1]).toContain(result1);
      
      // Measure in Hadamard basis
      const result2 = await processor.measure(0, 'hadamard');
      expect([0, 1]).toContain(result2);
    });

    it('should record measurement history', async () => {
      await processor.applyGate({ type: 'H', target: 0 });
      await processor.measure(0);
      
      const history = processor.getMeasurementHistory();
      expect(history.length).toBe(1);
      expect(history[0].qubit).toBe(0);
      expect([0, 1]).toContain(history[0].result);
    });

    it('should handle invalid measurement basis', async () => {
      await expect(processor.measure(0, 'invalid' as any)).rejects.toThrow('Invalid measurement basis');
    });
  });

  describe('error handling', () => {
    it('should record error history', async () => {
      const gate: QuantumGate = {
        type: 'X',
        target: 0,
        errorRate: 0.2
      };
      await processor.applyGate(gate);
      
      const errors = processor.getErrorHistory();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].type).toBe('gate');
      expect(errors[0].qubit).toBe(0);
    });

    it('should maintain coherence above threshold', async () => {
      // Apply multiple gates to test coherence
      for (let i = 0; i < 10; i++) {
        await processor.applyGate({ type: 'X', target: 0 });
      }
      
      const state = processor.getState();
      expect(state.qubits[0].coherence).toBeGreaterThan(backend.constraints.minCoherence);
    });
  });

  describe('optimization', () => {
    it('should optimize circuit', async () => {
      // Add some gates
      await processor.applyGate({ type: 'H', target: 0 });
      await processor.applyGate({ type: 'X', target: 1 });
      await processor.applyGate({ type: 'CNOT', target: 1, control: 0 });
      
      await processor.optimize();
      
      // Verify optimization completed without errors
      const state = processor.getState();
      expect(state).toBeDefined();
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources properly', async () => {
      await processor.applyGate({ type: 'H', target: 0 });
      await processor.measure(0);
      
      await processor.cleanup();
      
      expect(() => processor.getState()).toThrow('QuantumProcessor not initialized');
      expect(processor.getErrorHistory().length).toBe(0);
      expect(processor.getMeasurementHistory().length).toBe(0);
    });
  });
}); 