export { Bleu } from './core/Bleu';
export { BleuX } from './core/BleuX';
export { monitoring } from './core/monitoring';
export { decisionTree } from './ai/decisionTree';
export { deepLearning } from './ai/deepLearning';
export { nlpProcessor } from './ai/nlpProcessor';
export { modelDeployer } from './deployment/modelDeployer';
export { modelMonitor } from './monitoring/modelMonitor';
export interface BleuConfig {
    apiKey: string;
    version?: string;
    timeout?: number;
    retries?: number;
    model?: string;
    temperature?: number;
    maxTokens?: number;
}
export declare const DEFAULT_CONFIG: BleuConfig;
export declare const VERSION = "1.1.2";
export declare function createBleuApp(config?: Partial<BleuConfig>): Promise<Bleu>;
export type { TrainingData, ModelConfig } from './ai/decisionTree';
export type { DeepLearningConfig } from './ai/deepLearning';
export type { NLPConfig } from './ai/nlpProcessor';
export type { DeploymentConfig } from './deployment/modelDeployer';
export type { MonitoringConfig } from './monitoring/modelMonitor';
export declare class Bleu {
    private nlpProcessor;
    private codeAnalyzer;
    private henFarm;
    private config;
    constructor(config: BleuConfig);
    process(input: string | object): Promise<any>;
    generateCode(prompt: string, options?: any): Promise<string>;
    analyzeCode(code: string, options?: any): Promise<any>;
}
export default Bleu;
//# sourceMappingURL=index.d.ts.map