import * as tf from '@tensorflow/tfjs';
export declare class QuantumProcessor {
    private circuit;
    private optimizer;
    private featureExtractor;
    private stateManager;
    private noiseHandler;
    private entanglementManager;
    private metrics;
    constructor();
    initialize(): Promise<void>;
    enhanceInput(input: tf.Tensor): Promise<tf.Tensor>;
    optimizeDecision(decision: tf.Tensor): Promise<tf.Tensor>;
    optimizePredictions(predictions: tf.Tensor[]): Promise<tf.Tensor[]>;
    enhance(model: tf.LayersModel): Promise<tf.LayersModel>;
    private updateMetrics;
    getMetrics(): typeof this.metrics;
    dispose(): Promise<void>;
}
//# sourceMappingURL=quantumProcessor.d.ts.map