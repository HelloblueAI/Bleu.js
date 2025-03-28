"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitoringConfig = exports.MonitoringConfigManager = void 0;
const prom_client_1 = require("prom-client");
const defaultConfig = {
    performance: {
        collectionInterval: 60000, // 1 minute
        maxResponseTimes: 1000,
        enableCPUProfiling: true,
        enableMemoryProfiling: true
    },
    security: {
        scanInterval: 3600000, // 1 hour
        criticalThreshold: 0,
        enableVulnerabilityScanning: true,
        enableDependencyCheck: true,
        enableSystemHealthCheck: true
    },
    metrics: {
        enablePrometheus: true,
        enableCustomMetrics: true,
        retentionPeriod: 604800000, // 7 days
        labels: {
            environment: process.env.NODE_ENV || 'development',
            application: 'bleujs'
        }
    },
    logging: {
        level: 'info',
        format: 'json',
        destination: 'console'
    },
    alerts: {
        enableAlerts: true,
        cpuThreshold: 80, // 80%
        memoryThreshold: 85, // 85%
        responseTimeThreshold: 1000, // 1 second
        errorRateThreshold: 5, // 5%
        securityScoreThreshold: 70, // 70%
        notificationChannels: ['console']
    }
};
class MonitoringConfigManager {
    constructor() {
        this.config = { ...defaultConfig };
        this.prometheusRegistry = new prom_client_1.promClient.Registry();
        this.initializePrometheus();
    }
    static getInstance() {
        if (!MonitoringConfigManager.instance) {
            MonitoringConfigManager.instance = new MonitoringConfigManager();
        }
        return MonitoringConfigManager.instance;
    }
    initializePrometheus() {
        if (this.config.metrics.enablePrometheus) {
            // Add default metrics
            prom_client_1.promClient.collectDefaultMetrics({
                register: this.prometheusRegistry,
                prefix: 'bleujs_',
                labels: this.config.metrics.labels
            });
        }
    }
    getConfig() {
        return { ...this.config };
    }
    updateConfig(newConfig) {
        this.config = {
            ...this.config,
            ...newConfig
        };
    }
    getPrometheusRegistry() {
        return this.prometheusRegistry;
    }
    shouldAlert(metric, value) {
        if (!this.config.alerts.enableAlerts)
            return false;
        const threshold = this.config.alerts[metric];
        if (typeof threshold !== 'number')
            return false;
        switch (metric) {
            case 'cpuThreshold':
                return value > threshold;
            case 'memoryThreshold':
                return value > threshold;
            case 'responseTimeThreshold':
                return value > threshold;
            case 'errorRateThreshold':
                return value > threshold;
            case 'securityScoreThreshold':
                return value < threshold;
            default:
                return false;
        }
    }
    getNotificationChannels() {
        return [...this.config.alerts.notificationChannels];
    }
    getWebhookUrl() {
        return this.config.alerts.webhookUrl;
    }
    getEmailRecipients() {
        return this.config.alerts.emailRecipients;
    }
    getSlackWebhookUrl() {
        return this.config.alerts.slackWebhookUrl;
    }
    getLoggingConfig() {
        return { ...this.config.logging };
    }
    getPerformanceConfig() {
        return { ...this.config.performance };
    }
    getSecurityConfig() {
        return { ...this.config.security };
    }
    getMetricsConfig() {
        return { ...this.config.metrics };
    }
}
exports.MonitoringConfigManager = MonitoringConfigManager;
exports.monitoringConfig = MonitoringConfigManager.getInstance();
//# sourceMappingURL=monitoringConfig.js.map