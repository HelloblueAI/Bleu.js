export interface TrainingData {
    features: number[][];
    labels: string[];
}
export interface ModelConfig {
    maxDepth?: number;
    minSamplesSplit?: number;
    minSamplesLeaf?: number;
    criterion?: 'gini' | 'entropy';
    randomState?: number;
}
export interface Node {
    featureIndex?: number;
    threshold?: number;
    value?: string;
    left?: Node;
    right?: Node;
}
export declare class AdvancedDecisionTree {
    private model;
    private config;
    private quantumEnhancer;
    private uncertaintyHandler;
    private featureAnalyzer;
    private ensembleManager;
    private explainabilityEngine;
    private logger;
    constructor(config?: ModelConfig);
    initialize(): Promise<void>;
    train(data: TrainingData): Promise<void>;
    predict(features: number[][]): Promise<PredictionResult[]>;
    private predictSingle;
    private traverseTree;
    getFeatureImportance(): Promise<FeatureImportance[]>;
    getUncertaintyMetrics(): Promise<UncertaintyMetrics>;
    getExplanations(features: number[][]): Promise<Explanation[]>;
    dispose(): void;
    evaluate(features: number[][], labels: string[]): Record<string, number>;
}
export default AdvancedDecisionTree;
//# sourceMappingURL=decisionTree.d.ts.map