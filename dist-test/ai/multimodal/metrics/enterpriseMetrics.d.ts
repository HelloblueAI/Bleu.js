export declare class EnterpriseMetrics {
    private initialized;
    private metrics;
    initialize(): Promise<void>;
    startTracking(operation: string): Promise<void>;
    logMetrics(metrics: any): Promise<void>;
    logVisualizations(visualizations: any[]): Promise<void>;
    stopTracking(operation: string): Promise<void>;
    dispose(): Promise<void>;
}
//# sourceMappingURL=enterpriseMetrics.d.ts.map