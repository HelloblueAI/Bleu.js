import { EventEmitter } from 'events';
import { DeepLearningModel } from '../ai/deepLearning';
import { MonitoringConfig } from '../index';
interface Metric {
    timestamp: number;
    value: number;
    tags: Record<string, string>;
}
interface Alert {
    id: string;
    timestamp: number;
    type: 'lowAccuracy' | 'highLatency' | 'highErrorRate';
    severity: 'low' | 'medium' | 'high';
    message: string;
    details: Record<string, any>;
    resolved: boolean;
    resolvedAt?: number;
}
export declare class ModelMonitor extends EventEmitter {
    private metrics;
    private alerts;
    private config;
    private logger;
    private interval;
    private isMonitoring;
    private model;
    constructor(model: DeepLearningModel, config?: Partial<MonitoringConfig>);
    start(): Promise<void>;
    stop(): Promise<void>;
    private collectMetrics;
    private gatherMetrics;
    private checkAlerts;
    private createAlert;
    private cleanup;
    getMetrics(name?: string, timeRange?: {
        start: number;
        end: number;
    }): Record<string, Metric[]>;
    getAlerts(timeRange?: {
        start: number;
        end: number;
    }): Alert[];
    getMetricsSummary(timeRange?: {
        start: number;
        end: number;
    }): Record<string, {
        min: number;
        max: number;
        avg: number;
        count: number;
    }>;
    resolveAlert(alertId: string): void;
}
export {};
//# sourceMappingURL=modelMonitor.d.ts.map