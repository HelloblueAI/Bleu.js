import * as tf from '@tensorflow/tfjs-node';
export declare class QuantumEnhancer {
    private initialized;
    private quantumState;
    private optimizationParams;
    private quantumCircuit;
    private entanglementMap;
    private coherenceMonitor;
    private quantumMemory;
    constructor();
    initialize(): Promise<void>;
    private initializeQuantumCircuit;
    private setupQuantumMemory;
    private initializeCoherenceMonitor;
    enhanceModel(model: tf.GraphModel): Promise<tf.GraphModel>;
    enhanceInput(input: tf.Tensor): Promise<tf.Tensor>;
    private applyQuantumOptimization;
    private applyQuantumTransformation;
    private applyQuantumGate;
    private applyHadamardGate;
    private applyPhaseGate;
    private applyEntanglementGate;
    private updateQuantumState;
    private updateEntanglementMap;
    private monitorCoherence;
    private calculateAmplitude;
    private calculatePhase;
    private calculateEntanglement;
    private calculateCoherence;
    private extractQuantumFeatures;
    private optimizeCoherence;
    dispose(): Promise<void>;
}
//# sourceMappingURL=quantumEnhancer.d.ts.map