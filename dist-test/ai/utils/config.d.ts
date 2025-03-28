export interface ModelConfig {
    architecture: {
        type: string;
        layers: number;
        attentionHeads: number;
        hiddenSize: number;
        vocabularySize: number;
        maxSequenceLength: number;
    };
    training: {
        batchSize: number;
        learningRate: number;
        epochs: number;
        warmupSteps: number;
    };
    inference: {
        defaultMaxTokens: number;
        defaultTemperature: number;
        defaultTopP: number;
    };
}
export declare function loadModelConfig(configPath: string): Promise<ModelConfig>;
//# sourceMappingURL=config.d.ts.map