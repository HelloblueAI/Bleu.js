import { Logger } from '../utils/logger';
import { QuantumError } from '../types/errors';
import { Complex, Matrix, Qubit } from './types';

export enum GateType {
  X = 'X',      // Pauli-X (NOT)
  Y = 'Y',      // Pauli-Y
  Z = 'Z',      // Pauli-Z
  H = 'H',      // Hadamard
  CNOT = 'CNOT' // Controlled-NOT
}

export interface GateConfig {
  type: GateType;
  targetQubit: number;
  controlQubit?: number;
  params?: {
    theta?: number;
    phi?: number;
    lambda?: number;
  };
}

export class QuantumGate {
  private logger: Logger;
  private type: GateType;
  private targetQubit: number;
  private controlQubit?: number;
  private matrix: Matrix;

  constructor(config: GateConfig, logger: Logger) {
    this.logger = logger;
    this.type = config.type;
    this.targetQubit = config.targetQubit;
    this.controlQubit = config.controlQubit;
    this.matrix = this.initializeMatrix(config);
  }

  private initializeMatrix(config: GateConfig): Matrix {
    switch (config.type) {
      case GateType.X:
        return [
          [{ re: 0, im: 0 }, { re: 1, im: 0 }],
          [{ re: 1, im: 0 }, { re: 0, im: 0 }]
        ];
      case GateType.Y:
        return [
          [{ re: 0, im: 0 }, { re: 0, im: -1 }],
          [{ re: 0, im: 1 }, { re: 0, im: 0 }]
        ];
      case GateType.Z:
        return [
          [{ re: 1, im: 0 }, { re: 0, im: 0 }],
          [{ re: 0, im: 0 }, { re: -1, im: 0 }]
        ];
      case GateType.H:
        const sqrt2 = Math.sqrt(2);
        return [
          [{ re: 1/sqrt2, im: 0 }, { re: 1/sqrt2, im: 0 }],
          [{ re: 1/sqrt2, im: 0 }, { re: -1/sqrt2, im: 0 }]
        ];
      case GateType.CNOT:
        if (config.controlQubit === undefined) {
          throw new QuantumError('Control qubit must be specified for CNOT gate');
        }
        return [
          [{ re: 1, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }],
          [{ re: 0, im: 0 }, { re: 1, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }],
          [{ re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 1, im: 0 }],
          [{ re: 0, im: 0 }, { re: 0, im: 0 }, { re: 1, im: 0 }, { re: 0, im: 0 }]
        ];
      default:
        throw new QuantumError(`Unsupported gate type: ${config.type}`);
    }
  }

  apply(state: Qubit[]): Qubit[] {
    this.logger.debug(`Applying ${this.type} gate to qubit ${this.targetQubit}`);
    
    try {
      if (this.type === GateType.CNOT && this.controlQubit !== undefined) {
        return this.applyCNOT(state);
      }
      
      return this.applySingleQubitGate(state);
    } catch (error) {
      this.logger.error('Error applying quantum gate:', error);
      throw new QuantumError('Failed to apply quantum gate');
    }
  }

  private applySingleQubitGate(state: Qubit[]): Qubit[] {
    // Validate state
    if (!state || state.length === 0) {
      throw new QuantumError('Invalid quantum state');
    }

    // Apply gate matrix to target qubit
    const result = [...state];
    const target = result[this.targetQubit];
    
    result[this.targetQubit] = {
      amplitude: {
        re: this.matrix[0][0].re * target.amplitude.re - this.matrix[0][0].im * target.amplitude.im,
        im: this.matrix[0][0].re * target.amplitude.im + this.matrix[0][0].im * target.amplitude.re
      }
    };

    return result;
  }

  private applyCNOT(state: Qubit[]): Qubit[] {
    if (this.controlQubit === undefined) {
      throw new QuantumError('Control qubit not specified for CNOT gate');
    }

    // Validate state
    if (!state || state.length < 2) {
      throw new QuantumError('Invalid quantum state for CNOT operation');
    }

    const result = [...state];
    const control = result[this.controlQubit];
    const target = result[this.targetQubit];

    // Only flip target if control is |1⟩
    if (Math.abs(control.amplitude.re) > 0.99) {
      result[this.targetQubit] = {
        amplitude: {
          re: -target.amplitude.re,
          im: -target.amplitude.im
        }
      };
    }

    return result;
  }

  getType(): GateType {
    return this.type;
  }

  getMatrix(): Matrix {
    return this.matrix;
  }

  getTargetQubit(): number {
    return this.targetQubit;
  }

  getControlQubit(): number | undefined {
    return this.controlQubit;
  }
} 