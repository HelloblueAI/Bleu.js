import { BleuConfig } from '../types/config';
interface CodeAnalyzerConfig extends BleuConfig {
    bleuApiKey: string;
}
export declare class CodeAnalyzer {
    private config;
    private bleuAI;
    constructor(config: CodeAnalyzerConfig);
    analyzeCode(code: string): Promise<any>;
    generateCode(prompt: string): Promise<string>;
    optimizeCode(code: string): Promise<string>;
    refactorCode(code: string): Promise<string>;
}
export {};
//# sourceMappingURL=codeAnalyzer.d.ts.map