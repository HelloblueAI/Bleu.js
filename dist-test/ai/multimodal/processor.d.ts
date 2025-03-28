import { MultiModalConfig, MultiModalInput, ProcessedResult } from './types';
export declare class MultiModalProcessor {
    private config;
    private textProcessor;
    private codeProcessor;
    private imageProcessor;
    private audioProcessor;
    private videoProcessor;
    private crossModalFusion;
    private featureExtractor;
    private attentionMechanism;
    private quantumEnhancer;
    private securityManager;
    private performanceOptimizer;
    private advancedVisualizer;
    private enterpriseMetrics;
    private distributedProcessor;
    constructor(config: MultiModalConfig);
    initialize(): Promise<void>;
    process(input: MultiModalInput): Promise<ProcessedResult>;
    private extractFeatures;
    dispose(): void;
}
//# sourceMappingURL=processor.d.ts.map