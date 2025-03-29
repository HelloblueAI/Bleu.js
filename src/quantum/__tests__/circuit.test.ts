import { jest } from '@jest/globals';
import { QuantumCircuit } from '../circuit';
import { GateType } from '../gate';
import { Logger } from '../../utils/logger';
import { Circuit } from '../circuit';
import { QuantumGate } from '../types';

describe('QuantumCircuit', () => {
  let quantumCircuit: QuantumCircuit;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    quantumCircuit = new QuantumCircuit(mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with logger', () => {
      expect(quantumCircuit).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith('Initializing QuantumCircuit');
    });
  });

  describe('gate operations', () => {
    it('should add gate', () => {
      const gate = {
        type: GateType.H,
        targetQubit: 0
      };
      quantumCircuit.addGate(gate);
      expect(quantumCircuit.getGates()).toHaveLength(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Adding gate to circuit');
    });

    it('should handle invalid gate addition', () => {
      const invalidGate = null;
      expect(() => quantumCircuit.addGate(invalidGate)).toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should remove gate', () => {
      const gate = {
        type: GateType.H,
        targetQubit: 0
      };
      quantumCircuit.addGate(gate);
      const gates = quantumCircuit.getGates();
      quantumCircuit.removeGate(gates[0]);
      expect(quantumCircuit.getGates()).toHaveLength(0);
      expect(mockLogger.info).toHaveBeenCalledWith('Removing gate from circuit');
    });

    it('should handle invalid gate removal', () => {
      const invalidGate = null;
      expect(() => quantumCircuit.removeGate(invalidGate)).toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('circuit operations', () => {
    it('should get gates', () => {
      const gates = quantumCircuit.getGates();
      expect(gates).toBeDefined();
      expect(Array.isArray(gates)).toBe(true);
    });

    it('should get circuit depth', () => {
      const depth = quantumCircuit.getDepth();
      expect(depth).toBeDefined();
      expect(typeof depth).toBe('number');
    });

    it('should get gate count', () => {
      const count = quantumCircuit.getGateCount();
      expect(count).toBeDefined();
      expect(typeof count).toBe('number');
    });
  });

  describe('optimization', () => {
    it('should optimize circuit', async () => {
      await quantumCircuit.optimize();
      expect(mockLogger.info).toHaveBeenCalledWith('Optimizing circuit');
    });

    it('should handle optimization errors', async () => {
      jest.spyOn(quantumCircuit as any, 'optimizeCircuit').mockRejectedValueOnce(new Error('Optimization failed'));
      await expect(quantumCircuit.optimize()).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('should validate circuit', () => {
      const isValid = quantumCircuit.validate();
      expect(isValid).toBeDefined();
      expect(typeof isValid).toBe('boolean');
    });

    it('should handle validation errors', () => {
      jest.spyOn(quantumCircuit as any, 'validateCircuit').mockImplementationOnce(() => { throw new Error('Validation failed'); });
      expect(() => quantumCircuit.validate()).toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('circuit manipulation', () => {
    it('should combine circuits', () => {
      const otherCircuit = new QuantumCircuit(mockLogger);
      const combined = quantumCircuit.combine(otherCircuit);
      expect(combined).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith('Combining circuits');
    });

    it('should handle invalid circuit combination', () => {
      const invalidCircuit = null;
      expect(() => quantumCircuit.combine(invalidCircuit)).toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should clone circuit', () => {
      const clone = quantumCircuit.clone();
      expect(clone).toBeDefined();
      expect(clone).not.toBe(quantumCircuit);
      expect(mockLogger.info).toHaveBeenCalledWith('Cloning circuit');
    });
  });

  describe('cleanup', () => {
    it('should clean up resources', async () => {
      await quantumCircuit.cleanup();
      expect(mockLogger.info).toHaveBeenCalledWith('Cleaning up QuantumCircuit');
    });

    it('should handle cleanup errors', async () => {
      jest.spyOn(quantumCircuit as any, 'cleanupResources').mockRejectedValue(new Error('Cleanup failed'));
      await expect(quantumCircuit.cleanup()).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});

describe('Circuit', () => {
  let circuit: Circuit;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger('CircuitTest');
    circuit = new Circuit(4);
  });

  afterEach(async () => {
    await circuit.cleanup();
  });

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultCircuit = new Circuit(4);
      expect(defaultCircuit).toBeDefined();
    });

    it('should initialize with custom configuration', () => {
      const customCircuit = new Circuit(2);
      expect(customCircuit).toBeDefined();
    });
  });

  describe('gate operations', () => {
    it('should add valid gates', () => {
      const gate: QuantumGate = {
        type: 'H',
        target: 0
      };
      circuit.addGate(gate);
      
      // Verify gate was added
      const state = circuit.getState();
      expect(state.gates).toContainEqual(gate);
    });

    it('should handle invalid gate types', () => {
      const invalidGate: QuantumGate = {
        type: 'INVALID' as any,
        target: 0
      };
      expect(() => circuit.addGate(invalidGate)).toThrow('Invalid gate type');
    });

    it('should handle invalid target qubits', () => {
      const invalidGate: QuantumGate = {
        type: 'H',
        target: -1
      };
      expect(() => circuit.addGate(invalidGate)).toThrow('Invalid target qubit');
    });

    it('should handle invalid control qubits', () => {
      const invalidGate: QuantumGate = {
        type: 'CNOT',
        target: 0,
        control: -1
      };
      expect(() => circuit.addGate(invalidGate)).toThrow('Invalid control qubit');
    });
  });

  describe('optimization', () => {
    it('should optimize circuit depth', async () => {
      // Add some gates
      circuit.addGate({ type: 'H', target: 0 });
      circuit.addGate({ type: 'X', target: 1 });
      circuit.addGate({ type: 'CNOT', target: 1, control: 0 });
      
      await circuit.optimize();
      
      // Verify optimization metrics
      const state = circuit.getState();
      expect(state.optimization.depth).toBeDefined();
      expect(state.optimization.fidelity).toBeDefined();
      expect(state.optimization.noise).toBeDefined();
    });

    it('should maintain circuit validity after optimization', async () => {
      // Add gates
      circuit.addGate({ type: 'H', target: 0 });
      circuit.addGate({ type: 'X', target: 1 });
      
      await circuit.optimize();
      
      // Verify gates are still valid
      const state = circuit.getState();
      expect(state.gates.every(gate => 
        ['H', 'X', 'Y', 'Z', 'CNOT', 'SWAP', 'TOFFOLI'].includes(gate.type)
      )).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle gate addition errors', () => {
      const invalidGate = null as any;
      expect(() => circuit.addGate(invalidGate)).toThrow('Invalid gate format');
    });

    it('should handle optimization errors', async () => {
      // Force an optimization error by adding an invalid gate
      const invalidGate: QuantumGate = {
        type: 'H',
        target: -1
      };
      circuit.addGate(invalidGate);
      
      await expect(circuit.optimize()).rejects.toThrow('Failed to optimize circuit');
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources properly', async () => {
      // Add some gates
      circuit.addGate({ type: 'H', target: 0 });
      circuit.addGate({ type: 'X', target: 1 });
      
      await circuit.cleanup();
      
      // Verify circuit is cleaned up
      const state = circuit.getState();
      expect(state.gates.length).toBe(0);
      expect(state.measurements.length).toBe(0);
      expect(state.optimization.depth).toBe(0);
      expect(state.optimization.fidelity).toBe(1.0);
      expect(state.optimization.noise).toBe(0.0);
    });
  });

  describe('metrics', () => {
    it('should calculate circuit depth correctly', () => {
      circuit.addGate({ type: 'H', target: 0 });
      circuit.addGate({ type: 'X', target: 1 });
      circuit.addGate({ type: 'CNOT', target: 1, control: 0 });
      
      const state = circuit.getState();
      expect(state.optimization.depth).toBe(3);
    });

    it('should calculate fidelity correctly', () => {
      circuit.addGate({ type: 'H', target: 0, errorRate: 0.01 });
      circuit.addGate({ type: 'X', target: 1, errorRate: 0.02 });
      
      const state = circuit.getState();
      expect(state.optimization.fidelity).toBeLessThan(1.0);
      expect(state.optimization.fidelity).toBeGreaterThan(0.0);
    });

    it('should calculate noise correctly', () => {
      circuit.addGate({ type: 'H', target: 0, errorRate: 0.01 });
      circuit.addGate({ type: 'X', target: 1, errorRate: 0.02 });
      
      const state = circuit.getState();
      expect(state.optimization.noise).toBeGreaterThan(0.0);
      expect(state.optimization.noise).toBeLessThan(1.0);
    });
  });
}); 