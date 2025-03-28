export interface TextProcessorConfig {
    modelPath: string;
    maxSequenceLength: number;
    vocabularySize: number;
}
export declare class TextProcessor {
    private config;
    private model;
    private tokenizer;
    constructor(config: TextProcessorConfig);
    initialize(): Promise<void>;
    private initializeTokenizer;
    process(text: string): Promise<string>;
    extractFeatures(text: string): Promise<number[]>;
    private tokenize;
    private convertToTensor;
    private convertToText;
    dispose(): void;
}
//# sourceMappingURL=text.d.ts.map