import { BleuConfig } from '../types';
export declare class BleuAI {
    private config;
    private services;
    private quantum;
    private security;
    private nlpProcessor;
    private multimodalProcessor;
    private decisionTree;
    constructor(config: BleuConfig);
    initialize(): Promise<void>;
    private initializeModel;
    processInput(input: any): Promise<any>;
    private combineFeatures;
    generateCode(prompt: string): Promise<string>;
    optimizeCode(code: string): Promise<string>;
    refactorCode(code: string): Promise<string>;
    private processWithModel;
    private generateWithModel;
    private optimizeWithModel;
    private refactorWithModel;
    private validateResponse;
    dispose(): Promise<void>;
}
//# sourceMappingURL=bleuAI.d.ts.map