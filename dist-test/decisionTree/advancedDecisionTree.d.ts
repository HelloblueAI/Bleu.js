import * as tf from '@tensorflow/tfjs';
interface DecisionTreeConfig {
    maxDepth: number;
    minSamplesSplit: number;
    minSamplesLeaf: number;
    maxFeatures: number;
    useQuantumEnhancement: boolean;
    enableUncertaintyHandling: boolean;
    enableFeatureAnalysis: boolean;
    enableEnsemble: boolean;
    enableExplainability: boolean;
}
export declare class AdvancedDecisionTree {
    private config;
    private quantumEnhancer;
    private uncertaintyHandler;
    private featureAnalyzer;
    private ensembleManager;
    private explainabilityEngine;
    private model;
    private metrics;
    constructor(config: DecisionTreeConfig);
    initialize(): Promise<void>;
    train(X: tf.Tensor, y: tf.Tensor, validationData?: [tf.Tensor, tf.Tensor]): Promise<void>;
    predict(X: tf.Tensor, returnUncertainty?: boolean): Promise<{
        predictions: tf.Tensor;
        uncertainty?: number;
        explanations?: any;
    }>;
    private createModel;
    getFeatureImportance(): number[];
    getUncertainty(): number;
    getEnsembleDiversity(): number;
    getExplainabilityScore(): number;
    dispose(): Promise<void>;
}
export {};
//# sourceMappingURL=advancedDecisionTree.d.ts.map