interface NLPConfig {
    modelPath: string;
    numTransformerBlocks: number;
    numHeads: number;
    keyDim: number;
    ffDim: number;
    learningRate: number;
    modelVersion: string;
}
export declare class NLPProcessor {
    private config;
    private model;
    private tokenizer;
    private sentimentAnalyzer;
    private entityRecognizer;
    private topicModeler;
    private textSummarizer;
    private questionAnswerer;
    private hf;
    constructor(config: NLPConfig);
    initialize(): Promise<void>;
    private loadTokenizer;
    private createModel;
    process(text: string): Promise<any>;
    private tokenize;
    private tensorize;
    private extractFeatures;
    dispose(): Promise<void>;
}
export {};
//# sourceMappingURL=nlpProcessor.d.ts.map