export interface CodeProcessorConfig {
    modelPath: string;
    maxSequenceLength: number;
    vocabularySize: number;
}
interface CodeAnalysis {
    complexity: number;
    maintainability: number;
    security: number;
    performance: number;
    quality: number;
    suggestions: string[];
}
export declare class CodeProcessor {
    private config;
    private model;
    private tokenizer;
    constructor(config: CodeProcessorConfig);
    initialize(): Promise<void>;
    private initializeTokenizer;
    process(code: string): Promise<string>;
    analyze(code: string): Promise<CodeAnalysis>;
    extractFeatures(code: string): Promise<number[]>;
    private tokenize;
    private convertToTensor;
    private convertToCode;
    private calculateMetrics;
    private generateSuggestions;
    dispose(): void;
}
export {};
//# sourceMappingURL=code.d.ts.map