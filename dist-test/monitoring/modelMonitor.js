"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelMonitor = void 0;
const events_1 = require("events");
const winston_1 = require("winston");
class ModelMonitor extends events_1.EventEmitter {
    constructor(model, config = {}) {
        super();
        this.model = model;
        this.config = {
            enabled: true,
            interval: 60000,
            metrics: {
                accuracy: 0.95,
                latency: 100,
                throughput: 1000,
                errorRate: 0.01
            },
            alertThresholds: {
                lowAccuracy: 0.85,
                highLatency: 500,
                highErrorRate: 0.05
            },
            retention: {
                metrics: 7 * 24 * 60 * 60 * 1000,
                alerts: 30 * 24 * 60 * 60 * 1000
            },
            ...config
        };
        this.metrics = new Map();
        this.alerts = [];
        this.isMonitoring = false;
        this.interval = null;
        this.logger = (0, winston_1.createLogger)({
            level: 'info',
            format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json()),
            transports: [
                new winston_1.transports.Console({
                    format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.simple())
                }),
                new winston_1.transports.File({
                    filename: 'logs/monitoring.log',
                    maxsize: 10 * 1024 * 1024,
                    maxFiles: 5
                })
            ]
        });
    }
    async start() {
        if (this.isMonitoring) {
            this.logger.warn('Monitoring is already running');
            return;
        }
        this.isMonitoring = true;
        this.interval = setInterval(() => this.collectMetrics(), this.config.interval);
        this.logger.info('Model monitoring started');
    }
    async stop() {
        if (!this.isMonitoring) {
            this.logger.warn('Monitoring is not running');
            return;
        }
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.isMonitoring = false;
        this.logger.info('Model monitoring stopped');
    }
    async collectMetrics() {
        try {
            const metrics = await this.gatherMetrics();
            // Store metrics
            Object.entries(metrics).forEach(([name, value]) => {
                if (!this.metrics.has(name)) {
                    this.metrics.set(name, []);
                }
                this.metrics.get(name)?.push({
                    timestamp: Date.now(),
                    value,
                    tags: { source: 'model' }
                });
            });
            // Check for alerts
            await this.checkAlerts(metrics);
            // Cleanup old data
            this.cleanup();
            this.logger.debug('Metrics collected successfully', { metrics });
        }
        catch (error) {
            this.logger.error('Error collecting metrics:', error);
            this.emit('error', error);
        }
    }
    async gatherMetrics() {
        // This is a placeholder - implement actual metric gathering logic
        return {
            accuracy: Math.random() * 0.1 + 0.9,
            latency: Math.random() * 100,
            throughput: Math.random() * 1000,
            errorRate: Math.random() * 0.05
        };
    }
    async checkAlerts(metrics) {
        const { alertThresholds } = this.config;
        // Check accuracy
        if (metrics.accuracy < alertThresholds.lowAccuracy) {
            this.createAlert({
                type: 'lowAccuracy',
                severity: metrics.accuracy < alertThresholds.lowAccuracy * 0.8 ? 'high' : 'medium',
                message: `Model accuracy (${metrics.accuracy.toFixed(2)}) is below threshold (${alertThresholds.lowAccuracy})`,
                details: { current: metrics.accuracy, threshold: alertThresholds.lowAccuracy }
            });
        }
        // Check latency
        if (metrics.latency > alertThresholds.highLatency) {
            this.createAlert({
                type: 'highLatency',
                severity: metrics.latency > alertThresholds.highLatency * 1.5 ? 'high' : 'medium',
                message: `Model latency (${metrics.latency.toFixed(2)}ms) exceeds threshold (${alertThresholds.highLatency}ms)`,
                details: { current: metrics.latency, threshold: alertThresholds.highLatency }
            });
        }
        // Check error rate
        if (metrics.errorRate > alertThresholds.highErrorRate) {
            this.createAlert({
                type: 'highErrorRate',
                severity: metrics.errorRate > alertThresholds.highErrorRate * 1.5 ? 'high' : 'medium',
                message: `Model error rate (${metrics.errorRate.toFixed(2)}) exceeds threshold (${alertThresholds.highErrorRate})`,
                details: { current: metrics.errorRate, threshold: alertThresholds.highErrorRate }
            });
        }
    }
    createAlert(alert) {
        const newAlert = {
            ...alert,
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            resolved: false
        };
        this.alerts.push(newAlert);
        this.logger.warn('Alert created:', newAlert);
        this.emit('alert', newAlert);
    }
    cleanup() {
        const now = Date.now();
        const { retention } = this.config;
        // Cleanup metrics
        this.metrics.forEach((metrics, name) => {
            this.metrics.set(name, metrics.filter(m => now - m.timestamp <= retention.metrics));
        });
        // Cleanup alerts
        this.alerts = this.alerts.filter(alert => now - alert.timestamp <= retention.alerts);
    }
    getMetrics(name, timeRange) {
        if (name) {
            return { [name]: this.metrics.get(name) || [] };
        }
        const result = {};
        this.metrics.forEach((metrics, name) => {
            result[name] = timeRange
                ? metrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end)
                : metrics;
        });
        return result;
    }
    getAlerts(timeRange) {
        if (!timeRange) {
            return this.alerts;
        }
        return this.alerts.filter(alert => alert.timestamp >= timeRange.start && alert.timestamp <= timeRange.end);
    }
    getMetricsSummary(timeRange) {
        const summary = {};
        this.metrics.forEach((metrics, name) => {
            const filteredMetrics = timeRange
                ? metrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end)
                : metrics;
            if (filteredMetrics.length === 0) {
                summary[name] = { min: 0, max: 0, avg: 0, count: 0 };
                return;
            }
            const values = filteredMetrics.map(m => m.value);
            summary[name] = {
                min: Math.min(...values),
                max: Math.max(...values),
                avg: values.reduce((a, b) => a + b, 0) / values.length,
                count: values.length
            };
        });
        return summary;
    }
    resolveAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert && !alert.resolved) {
            alert.resolved = true;
            alert.resolvedAt = Date.now();
            this.logger.info(`Alert resolved: ${alertId}`);
            this.emit('alertResolved', alert);
        }
    }
}
exports.ModelMonitor = ModelMonitor;
//# sourceMappingURL=modelMonitor.js.map