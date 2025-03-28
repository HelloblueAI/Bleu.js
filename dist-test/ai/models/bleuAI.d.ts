import { BleuConfig } from '../../types/config';
export interface Tokenizer {
    encode(text: string): Promise<number[]>;
    decode(tokens: number[]): Promise<string>;
    vocabSize: number;
}
export declare class BleuAI {
    private model;
    private tokenizer;
    private config;
    constructor(config: BleuConfig);
    initialize(): Promise<void>;
    private createModel;
    process(text: string): Promise<string>;
    analyzeCode(code: string): Promise<any>;
    private parseCodeAnalysis;
    dispose(): Promise<void>;
}
//# sourceMappingURL=bleuAI.d.ts.map