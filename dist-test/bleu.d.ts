interface BleuConfig {
    modelPath?: string;
    architecture?: {
        type?: string;
        layers?: number;
        attentionHeads?: number;
        hiddenSize?: number;
        vocabularySize?: number;
        maxSequenceLength?: number;
        useQuantumComputing?: boolean;
        enableMultiModal?: boolean;
        enableReinforcementLearning?: boolean;
    };
    cluster?: {
        enabled?: boolean;
        nodes?: number;
        autoScale?: boolean;
    };
    security?: {
        encryptionLevel?: 'standard' | 'military' | 'quantum';
        enableAuditLogging?: boolean;
        enableThreatDetection?: boolean;
    };
    performance?: {
        enableGPU?: boolean;
        enableTPU?: boolean;
        enableDistributedTraining?: boolean;
        enableAutoOptimization?: boolean;
    };
}
interface ProcessOptions {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    useQuantumComputing?: boolean;
    enableMultiModal?: boolean;
    enableReinforcementLearning?: boolean;
    securityLevel?: 'standard' | 'military' | 'quantum';
}
interface AnalysisResult {
    codeQuality: number;
    securityScore: number;
    performanceScore: number;
    maintainabilityScore: number;
    recommendations: string[];
    quantumOptimizations?: string[];
    threatAnalysis?: {
        vulnerabilities: string[];
        riskLevel: 'low' | 'medium' | 'high' | 'critical';
        mitigationStrategies: string[];
    };
}
export declare class Bleu {
    private config;
    private model;
    private monitor;
    private deployer;
    private securityAnalyzer;
    private performanceOptimizer;
    private clusterManager;
    private logger;
    constructor(config?: BleuConfig);
    initialize(): Promise<this>;
    process(input: string, options?: ProcessOptions): Promise<string>;
    analyzeCode(code: string): Promise<AnalysisResult>;
    optimizePerformance(): Promise<void>;
    deployModel(): Promise<void>;
    monitorHealth(): Promise<any>;
    dispose(): void;
}
export {};
//# sourceMappingURL=bleu.d.ts.map