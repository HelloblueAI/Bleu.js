import * as tf from '@tensorflow/tfjs-node';
interface QuantumCircuitConfig {
    numQubits: number;
    depth: number;
    optimizationLevel: number;
    errorCorrection: boolean;
    quantumMemory: boolean;
}
export declare class QuantumCircuit {
    private config;
    private registers;
    private gates;
    private state;
    constructor(config?: Partial<QuantumCircuitConfig>);
    initialize(): Promise<void>;
    private initializeQuantumState;
    private createQuantumRegisters;
    private createQuantumGates;
    private initializeErrorCorrection;
    private initializeQuantumMemory;
    createOptimizationCircuits(model: tf.LayersModel): Promise<QuantumCircuit[]>;
    optimizeWeights(weights: tf.Tensor[], circuits: QuantumCircuit[]): Promise<tf.Tensor[]>;
    private applyQuantumOptimization;
    private tensorToQuantumState;
    private quantumStateToTensor;
    private applyGate;
    getAccelerationFactor(): Promise<number>;
    generateOptimizationCircuits(): Promise<QuantumCircuit[]>;
    private createVQECircuit;
    private createQAOACircuit;
    private createQNNCircuit;
    dispose(): Promise<void>;
}
export {};
//# sourceMappingURL=circuit.d.ts.map