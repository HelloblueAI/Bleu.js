import * as tf from '@tensorflow/tfjs';
interface MultiModalConfig {
    modelPath: string;
    visionModel: string;
    languageModel: string;
    audioModel: string;
    codeModel: string;
    fusionType: 'attention' | 'transformer' | 'graph';
    maxSequenceLength: number;
    batchSize: number;
}
export declare class MultiModalProcessor {
    private config;
    private crossModalFusion;
    private featureExtractor;
    private crossModalAttention;
    private visionLanguageModel;
    private audioVisualFusion;
    private textCodeFusion;
    private metrics;
    constructor(config: MultiModalConfig);
    initialize(): Promise<void>;
    process(input: {
        text?: string;
        code?: string;
        image?: tf.Tensor;
        audio?: tf.Tensor;
        video?: tf.Tensor;
    }): Promise<any>;
    private extractFeatures;
    private applySpecializedFusion;
    private combineFeatures;
    private updateMetrics;
    private calculateCrossModalAlignment;
    getMetrics(): typeof this.metrics;
    dispose(): Promise<void>;
}
export {};
//# sourceMappingURL=processor.d.ts.map