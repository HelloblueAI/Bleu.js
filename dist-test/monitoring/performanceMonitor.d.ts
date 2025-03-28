import { EventEmitter } from 'events';
interface PerformanceMetrics {
    cpu: {
        usage: number;
        cores: number;
        load: number[];
    };
    memory: {
        used: number;
        total: number;
        heapUsed: number;
        heapTotal: number;
        external: number;
    };
    responseTime: {
        p50: number;
        p90: number;
        p95: number;
        p99: number;
    };
    requests: {
        total: number;
        success: number;
        error: number;
        rate: number;
    };
    customMetrics: Record<string, number>;
}
declare class PerformanceMonitor extends EventEmitter {
    private metrics;
    private prometheusMetrics;
    private collectionInterval;
    private responseTimes;
    private lastRequestCount;
    private lastCollectionTime;
    constructor(collectionIntervalMs?: number);
    private initializeMetrics;
    private collectMetrics;
    private getCPUUsage;
    private calculatePercentile;
    private updatePrometheusMetrics;
    recordResponseTime(responseTime: number): void;
    recordRequest(success: boolean): void;
    getMetrics(): PerformanceMetrics;
    stop(): void;
}
export { PerformanceMonitor, PerformanceMetrics };
//# sourceMappingURL=performanceMonitor.d.ts.map