import { QuantumProcessor } from '../quantumProcessor';
import { QuantumCircuit, QuantumGate, QuantumError } from '../../types/quantum';
import { Logger } from '../../utils/logger';
import { ProcessorConfig } from '../types';

describe('QuantumProcessor', () => {
  let processor: QuantumProcessor;
  let logger: Logger;
  let config: ProcessorConfig;

  beforeEach(async () => {
    logger = new Logger('QuantumProcessorTest');
    config = {
      numQubits: 2,
      errorCorrection: true,
      optimizationLevel: 1,
      maxDepth: 10
    };

    processor = new QuantumProcessor(config, logger);
    await processor.initialize();
  });

  afterEach(async () => {
    await processor.cleanup();
  });

  describe('Circuit Processing', () => {
    it('should process a simple circuit with Hadamard gate', async () => {
      const circuit = new QuantumCircuit({ numQubits: 1 }, logger);
      circuit.addGate({ type: 'H', targetQubit: 0 });

      await processor.processCircuit(circuit);
      const state = processor.getState();
      
      expect(state).toBeDefined();
      expect(state?.qubits.length).toBe(2);
      expect(state?.qubits[0].amplitude.re).toBeCloseTo(1/Math.sqrt(2), 6);
      expect(state?.qubits[0].amplitude.im).toBeCloseTo(0, 6);
    });

    it('should process a circuit with multiple gates and entanglement', async () => {
      const circuit = new QuantumCircuit({ numQubits: 2 }, logger);
      circuit.addGate({ type: 'H', targetQubit: 0 });
      circuit.addGate({ type: 'CNOT', controlQubit: 0, targetQubit: 1 });

      await processor.processCircuit(circuit);
      const state = processor.getState();
      
      expect(state).toBeDefined();
      expect(state?.qubits.length).toBe(2);
      expect(state?.qubits[1].amplitude.re).toBeCloseTo(1/Math.sqrt(2), 6);
      expect(state?.qubits[1].amplitude.im).toBeCloseTo(0, 6);
    });

    it('should handle advanced gates like Toffoli', async () => {
      const circuit = new QuantumCircuit({ numQubits: 3 }, logger);
      circuit.addGate({ type: 'H', targetQubit: 0 });
      circuit.addGate({ type: 'H', targetQubit: 1 });
      circuit.addGate({ type: 'TOFFOLI', controlQubit: 0, control2Qubit: 1, targetQubit: 2 });

      await processor.processCircuit(circuit);
      const state = processor.getState();
      
      expect(state).toBeDefined();
      expect(state?.qubits.length).toBe(3);
      expect(state?.qubits[2].amplitude.re).toBeCloseTo(0.5, 6);
      expect(state?.qubits[2].amplitude.im).toBeCloseTo(0, 6);
    });

    it('should apply error correction', async () => {
      const circuit = new QuantumCircuit({ numQubits: 2 }, logger);
      circuit.addGate({ type: 'H', targetQubit: 0 });
      circuit.addGate({ type: 'CNOT', controlQubit: 0, targetQubit: 1 });

      await processor.processCircuit(circuit);
      const state = processor.getState();
      
      expect(state).toBeDefined();
      expect(state?.qubits[0].errorRate).toBeLessThan(0.1);
      expect(state?.qubits[1].errorRate).toBeLessThan(0.1);
    });

    it('should handle noise and decoherence', async () => {
      const circuit = new QuantumCircuit({ numQubits: 2 }, logger);
      circuit.addGate({ type: 'H', targetQubit: 0 });
      circuit.addGate({ type: 'CNOT', controlQubit: 0, targetQubit: 1 });

      await processor.processCircuit(circuit);
      const state = processor.getState();
      
      // Check that amplitudes are properly normalized
      const norm = Math.sqrt(
        state!.qubits.reduce((sum, qubit) => 
          sum + Math.pow(qubit.amplitude.re, 2) + Math.pow(qubit.amplitude.im, 2), 0)
      );
      expect(Math.abs(norm - 1)).toBeLessThan(0.0001);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid gate type', async () => {
      const circuit = new QuantumCircuit({ numQubits: 1 }, logger);
      circuit.addGate({ type: 'INVALID' as any, targetQubit: 0 });

      await expect(processor.processCircuit(circuit)).rejects.toThrow(QuantumError);
    });

    it('should throw error for missing control qubit in CNOT', async () => {
      const circuit = new QuantumCircuit({ numQubits: 2 }, logger);
      circuit.addGate({ type: 'CNOT', targetQubit: 1 });

      await expect(processor.processCircuit(circuit)).rejects.toThrow(QuantumError);
    });

    it('should throw error for uninitialized processor', async () => {
      const processor = new QuantumProcessor(config, logger);
      const circuit = new QuantumCircuit({ numQubits: 1 }, logger);
      circuit.addGate({ type: 'H', targetQubit: 0 });

      await expect(processor.processCircuit(circuit)).rejects.toThrow(QuantumError);
    });
  });

  describe('Measurement', () => {
    it('should perform measurement on initialized state', async () => {
      const circuit = new QuantumCircuit({ numQubits: 1 }, logger);
      circuit.addGate({ type: 'H', targetQubit: 0 });

      await processor.processCircuit(circuit);
      const measurement = processor.measure(0);
      
      expect(measurement).toBeDefined();
      expect(typeof measurement).toBe('number');
      expect(measurement).toBeGreaterThanOrEqual(0);
      expect(measurement).toBeLessThanOrEqual(1);
    });

    it('should throw error when measuring without initialized state', () => {
      expect(() => processor.measure(0)).toThrow(QuantumError);
    });
  });

  describe('State Management', () => {
    it('should reset state properly', async () => {
      const circuit = new QuantumCircuit({ numQubits: 1 }, logger);
      circuit.addGate({ type: 'H', targetQubit: 0 });

      await processor.processCircuit(circuit);
      expect(processor.getState()).toBeDefined();

      processor.reset();
      const state = processor.getState();
      expect(state).toBeDefined();
      expect(state?.qubits[0].amplitude.re).toBe(1);
      expect(state?.qubits[0].amplitude.im).toBe(0);
    });

    it('should cleanup resources properly', async () => {
      await processor.cleanup();
      // Verify cleanup by checking if we can't process circuits anymore
      const circuit = new QuantumCircuit({ numQubits: 1 }, logger);
      circuit.addGate({ type: 'H', targetQubit: 0 });
      await expect(processor.processCircuit(circuit)).rejects.toThrow(QuantumError);
    });
  });
}); 