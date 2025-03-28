export interface QuantumRegister {
    id: string;
    state: number;
    entangled: boolean;
    errorRate: number;
    connectedQubits?: string[];
}
export interface QuantumGate {
    name: string;
    matrix: (number | Complex)[][];
    targetQubits?: number[];
    controlQubits?: number[];
    phase?: number;
    fidelity?: number;
}
export interface QuantumState {
    amplitudes: Float32Array;
    numQubits: number;
    qram?: Float32Array;
    entanglement?: {
        pairs: [number, number][];
        strength: number[];
    };
    decoherence?: {
        rate: number;
        time: number;
    };
}
export interface QuantumMeasurement {
    qubit: number;
    basis: 'computational' | 'bell' | 'pauli-x' | 'pauli-y' | 'pauli-z';
    result: number;
    probability: number;
    uncertainty: number;
}
export interface QuantumError {
    type: 'bit-flip' | 'phase-flip' | 'depolarizing' | 'amplitude-damping';
    rate: number;
    affectedQubits: number[];
    correctionStrategy?: string;
}
export interface QuantumCircuitMetrics {
    depth: number;
    width: number;
    numGates: number;
    entanglementDepth: number;
    fidelity: number;
    errorRate: number;
    coherenceTime: number;
}
export interface QuantumOptimizationResult {
    circuit: QuantumCircuit;
    metrics: QuantumCircuitMetrics;
    measurements: QuantumMeasurement[];
    errors: QuantumError[];
    success: boolean;
}
export interface QuantumAlgorithm {
    name: string;
    type: 'VQE' | 'QAOA' | 'QNN' | 'Grover' | 'Shor';
    parameters: {
        iterations: number;
        convergenceThreshold: number;
        optimizationMethod: string;
        [key: string]: any;
    };
    circuit: QuantumCircuit;
}
export interface QuantumMemoryCell {
    address: number;
    value: Float32Array;
    coherenceTime: number;
    entangledWith?: number[];
}
export interface QuantumRegisterState {
    register: QuantumRegister;
    amplitude: Complex;
    phase: number;
    probability: number;
}
export interface Complex {
    real: number;
    imag: number;
}
export interface QuantumGateSet {
    single: {
        hadamard: QuantumGate;
        pauliX: QuantumGate;
        pauliY: QuantumGate;
        pauliZ: QuantumGate;
        phase: QuantumGate;
        rotation: (angle: number) => QuantumGate;
    };
    multi: {
        cnot: QuantumGate;
        swap: QuantumGate;
        toffoli: QuantumGate;
        fredkin: QuantumGate;
    };
    custom: {
        controlled: (gate: QuantumGate) => QuantumGate;
        tensor: (gates: QuantumGate[]) => QuantumGate;
        inverse: (gate: QuantumGate) => QuantumGate;
    };
}
export interface QuantumCircuit {
    config: {
        numQubits: number;
        depth: number;
        optimizationLevel: number;
        errorCorrection: boolean;
        quantumMemory: boolean;
    };
    registers: QuantumRegister[];
    gates: QuantumGate[];
    state: QuantumState;
    metrics: QuantumCircuitMetrics;
    memory?: QuantumMemoryCell[];
}
export declare function Complex(real: number, imag?: number): Complex;
//# sourceMappingURL=types.d.ts.map