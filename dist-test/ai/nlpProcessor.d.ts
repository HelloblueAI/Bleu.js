import * as tf from '@tensorflow/tfjs';
export interface NLPConfig {
    modelPath: string;
    maxSequenceLength: number;
    vocabularySize: number;
    embeddingDim: number;
    numLayers: number;
    hiddenUnits: number;
    dropoutRate: number;
    numTransformerBlocks: number;
    numHeads: number;
    keyDim: number;
    ffDim: number;
    learningRate: number;
    modelVersion: string;
}
export declare class NLPProcessor {
    private model;
    private config;
    private tokenizer;
    private sentimentAnalyzer;
    private entityRecognizer;
    private topicModeler;
    private summarizer;
    private questionAnswerer;
    private logger;
    constructor(config: NLPConfig);
    initialize(): Promise<void>;
    private initializeTokenizer;
    private createModel;
    process(text: string): Promise<ProcessedResult>;
    private tokenize;
    private convertToTensor;
    private extractIntermediateFeatures;
    processText(text: string): Promise<number>;
    analyzeText(text: string): Promise<{
        sentiment: number;
        entities: string[];
        keywords: string[];
    }>;
    private padSequence;
    train(texts: string[], labels: number[]): Promise<tf.History>;
    evaluate(texts: string[], labels: number[]): Promise<{
        loss: number;
        accuracy: number;
    }>;
    dispose(): void;
}
export default NLPProcessor;
//# sourceMappingURL=nlpProcessor.d.ts.map