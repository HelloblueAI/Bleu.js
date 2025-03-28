interface DeploymentConfig {
    port: number;
    host: string;
    modelPath: string;
    batchSize: number;
    maxRequests: number;
    timeout: number;
    cors: boolean;
    rateLimit: {
        windowMs: number;
        max: number;
    };
    monitoring: {
        enabled: boolean;
        metrics: string[];
    };
}
interface DeploymentMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    modelLoadTime: number;
    lastModelUpdate: Date;
}
export declare class ModelDeployer {
    private app;
    private model;
    private logger;
    private config;
    private metrics;
    private server;
    constructor(config?: DeploymentConfig);
    initialize(): Promise<void>;
    private setupMiddleware;
    private setupRoutes;
    start(): Promise<void>;
    stop(): Promise<void>;
    getMetrics(): DeploymentMetrics;
    updateModel(modelPath: string): Promise<void>;
    predict(features: number[][]): Promise<number[]>;
}
export {};
//# sourceMappingURL=modelDeployer.d.ts.map