import { promClient } from 'prom-client';
export interface MonitoringConfig {
    performance: {
        collectionInterval: number;
        maxResponseTimes: number;
        enableCPUProfiling: boolean;
        enableMemoryProfiling: boolean;
    };
    security: {
        scanInterval: number;
        criticalThreshold: number;
        enableVulnerabilityScanning: boolean;
        enableDependencyCheck: boolean;
        enableSystemHealthCheck: boolean;
    };
    metrics: {
        enablePrometheus: boolean;
        enableCustomMetrics: boolean;
        retentionPeriod: number;
        labels: Record<string, string>;
    };
    logging: {
        level: 'error' | 'warn' | 'info' | 'debug';
        format: 'json' | 'text';
        destination: 'console' | 'file' | 'both';
        filePath?: string;
    };
    alerts: {
        enableAlerts: boolean;
        cpuThreshold: number;
        memoryThreshold: number;
        responseTimeThreshold: number;
        errorRateThreshold: number;
        securityScoreThreshold: number;
        notificationChannels: ('email' | 'slack' | 'webhook')[];
        webhookUrl?: string;
        emailRecipients?: string[];
        slackWebhookUrl?: string;
    };
}
export declare class MonitoringConfigManager {
    private static instance;
    private config;
    private prometheusRegistry;
    private constructor();
    static getInstance(): MonitoringConfigManager;
    private initializePrometheus;
    getConfig(): MonitoringConfig;
    updateConfig(newConfig: Partial<MonitoringConfig>): void;
    getPrometheusRegistry(): typeof promClient.Registry;
    shouldAlert(metric: keyof MonitoringConfig['alerts'], value: number): boolean;
    getNotificationChannels(): MonitoringConfig['alerts']['notificationChannels'];
    getWebhookUrl(): string | undefined;
    getEmailRecipients(): string[] | undefined;
    getSlackWebhookUrl(): string | undefined;
    getLoggingConfig(): MonitoringConfig['logging'];
    getPerformanceConfig(): MonitoringConfig['performance'];
    getSecurityConfig(): MonitoringConfig['security'];
    getMetricsConfig(): MonitoringConfig['metrics'];
}
export declare const monitoringConfig: MonitoringConfigManager;
//# sourceMappingURL=monitoringConfig.d.ts.map