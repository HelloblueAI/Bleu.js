import { QuantumOptimizer } from '../optimizer';
import { QuantumCircuit, QuantumGate } from '../types';
import { Logger } from '../../utils/logger';

// Mock the Logger class
jest.mock('../../utils/logger', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  };
  return {
    Logger: jest.fn().mockImplementation(() => mockLogger),
    createLogger: jest.fn().mockImplementation(() => mockLogger)
  };
});

describe('QuantumOptimizer', () => {
  let optimizer: QuantumOptimizer;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = new Logger('QuantumOptimizer', false) as jest.Mocked<Logger>;
    optimizer = new QuantumOptimizer(mockLogger);
  });

  describe('optimizeCircuit', () => {
    it('should optimize a circuit with redundant gates', () => {
      const circuit = new QuantumCircuit({ numQubits: 1 }, mockLogger);
      circuit.addGate({ type: 'H', targetQubit: 0 });
      circuit.addGate({ type: 'H', targetQubit: 0 });

      const optimizedCircuit = optimizer.optimizeCircuit(circuit);
      expect(optimizedCircuit.getGates().length).toBe(0); // Redundant gates should be removed
      expect(mockLogger.debug).toHaveBeenCalledWith('Starting circuit optimization');
      expect(mockLogger.debug).toHaveBeenCalledWith('Circuit optimization completed');
    });

    it('should optimize gate order for better execution', () => {
      const circuit = new QuantumCircuit({ numQubits: 2 }, mockLogger);
      circuit.addGate({ type: 'CNOT', targetQubit: 0, controlQubit: 1 });
      circuit.addGate({ type: 'H', targetQubit: 0 });
      circuit.addGate({ type: 'X', targetQubit: 1 });

      const optimizedCircuit = optimizer.optimizeCircuit(circuit);
      expect(optimizedCircuit.getGates().length).toBe(3);
      // Gates should be reordered to minimize qubit state changes
      expect(optimizedCircuit.getGates()[0].getTargetQubit()).toBe(0);
      expect(mockLogger.debug).toHaveBeenCalledWith('Starting circuit optimization');
      expect(mockLogger.debug).toHaveBeenCalledWith('Circuit optimization completed');
    });

    it('should reduce circuit depth by parallelizing gates', () => {
      const circuit = new QuantumCircuit({ numQubits: 3 }, mockLogger);
      circuit.addGate({ type: 'H', targetQubit: 0 });
      circuit.addGate({ type: 'X', targetQubit: 1 });
      circuit.addGate({ type: 'H', targetQubit: 2 });

      const optimizedCircuit = optimizer.optimizeCircuit(circuit);
      expect(optimizedCircuit.getGates().length).toBe(3);
      // Gates operating on different qubits should be in the same layer
      const gates = optimizedCircuit.getGates();
      expect(gates[0].getTargetQubit()).not.toBe(gates[1].getTargetQubit());
      expect(mockLogger.debug).toHaveBeenCalledWith('Starting circuit optimization');
      expect(mockLogger.debug).toHaveBeenCalledWith('Circuit optimization completed');
    });

    it('should preserve circuit functionality while optimizing', () => {
      const circuit = new QuantumCircuit({ numQubits: 2 }, mockLogger);
      circuit.addGate({ type: 'H', targetQubit: 0 });
      circuit.addGate({ type: 'CNOT', targetQubit: 0, controlQubit: 1 });
      circuit.addGate({ type: 'X', targetQubit: 1 });

      const optimizedCircuit = optimizer.optimizeCircuit(circuit);
      expect(optimizedCircuit.getNumQubits()).toBe(2);
      expect(optimizedCircuit.getGates().length).toBe(3);
      // All original gates should be present in some form
      const gateTypes = optimizedCircuit.getGates().map(gate => gate.getType());
      expect(gateTypes).toContain('H');
      expect(gateTypes).toContain('CNOT');
      expect(gateTypes).toContain('X');
      expect(mockLogger.debug).toHaveBeenCalledWith('Starting circuit optimization');
      expect(mockLogger.debug).toHaveBeenCalledWith('Circuit optimization completed');
    });

    it('should handle empty circuit', () => {
      const circuit = new QuantumCircuit({ numQubits: 1 }, mockLogger);
      const optimizedCircuit = optimizer.optimizeCircuit(circuit);
      expect(optimizedCircuit.getGates().length).toBe(0);
      expect(optimizedCircuit.getNumQubits()).toBe(1);
      expect(mockLogger.debug).toHaveBeenCalledWith('Starting circuit optimization');
      expect(mockLogger.debug).toHaveBeenCalledWith('Circuit optimization completed');
    });

    it('should handle single-gate circuit', () => {
      const circuit = new QuantumCircuit({ numQubits: 1 }, mockLogger);
      circuit.addGate({ type: 'H', targetQubit: 0 });

      const optimizedCircuit = optimizer.optimizeCircuit(circuit);
      expect(optimizedCircuit.getGates().length).toBe(1);
      expect(optimizedCircuit.getGates()[0].getType()).toBe('H');
      expect(optimizedCircuit.getGates()[0].getTargetQubit()).toBe(0);
      expect(mockLogger.debug).toHaveBeenCalledWith('Starting circuit optimization');
      expect(mockLogger.debug).toHaveBeenCalledWith('Circuit optimization completed');
    });
  });

  describe('cleanup', () => {
    it('should clean up resources', async () => {
      await optimizer.cleanup();
      expect(mockLogger.info).toHaveBeenCalledWith('Cleaning up quantum optimizer');
      expect(mockLogger.info).toHaveBeenCalledWith('Quantum optimizer cleanup completed');
    });
  });
}); 