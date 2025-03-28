"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMonitor = void 0;
const prom_client_1 = require("prom-client");
const events_1 = require("events");
class PerformanceMonitor extends events_1.EventEmitter {
    constructor(collectionIntervalMs = 60000) {
        super();
        this.responseTimes = [];
        this.lastRequestCount = 0;
        this.lastCollectionTime = Date.now();
        this.metrics = this.initializeMetrics();
        this.prometheusMetrics = prometheusMetrics;
        this.collectionInterval = setInterval(() => this.collectMetrics(), collectionIntervalMs);
    }
    initializeMetrics() {
        return {
            cpu: {
                usage: 0,
                cores: require('os').cpus().length,
                load: require('os').loadavg()
            },
            memory: {
                used: 0,
                total: 0,
                heapUsed: 0,
                heapTotal: 0,
                external: 0
            },
            responseTime: {
                p50: 0,
                p90: 0,
                p95: 0,
                p99: 0
            },
            requests: {
                total: 0,
                success: 0,
                error: 0,
                rate: 0
            },
            customMetrics: {}
        };
    }
    async collectMetrics() {
        try {
            // Collect CPU metrics
            const cpuUsage = await this.getCPUUsage();
            this.metrics.cpu.usage = cpuUsage;
            this.metrics.cpu.load = require('os').loadavg();
            // Collect memory metrics
            const memoryUsage = process.memoryUsage();
            this.metrics.memory = {
                used: memoryUsage.heapUsed,
                total: memoryUsage.heapTotal,
                heapUsed: memoryUsage.heapUsed,
                heapTotal: memoryUsage.heapTotal,
                external: memoryUsage.external
            };
            // Calculate response time percentiles
            if (this.responseTimes.length > 0) {
                this.responseTimes.sort((a, b) => a - b);
                this.metrics.responseTime = {
                    p50: this.calculatePercentile(50),
                    p90: this.calculatePercentile(90),
                    p95: this.calculatePercentile(95),
                    p99: this.calculatePercentile(99)
                };
            }
            // Calculate request rate
            const now = Date.now();
            const timeDiff = (now - this.lastCollectionTime) / 1000; // in seconds
            const requestDiff = this.metrics.requests.total - this.lastRequestCount;
            this.metrics.requests.rate = requestDiff / timeDiff;
            // Update last collection values
            this.lastCollectionTime = now;
            this.lastRequestCount = this.metrics.requests.total;
            // Update Prometheus metrics
            this.updatePrometheusMetrics();
            // Emit metrics update event
            this.emit('metricsUpdate', this.metrics);
        }
        catch (error) {
            console.error('Error collecting performance metrics:', error);
        }
    }
    async getCPUUsage() {
        const startUsage = process.cpuUsage();
        await new Promise(resolve => setTimeout(resolve, 100));
        const endUsage = process.cpuUsage(startUsage);
        const totalUsage = endUsage.user + endUsage.system;
        const totalTime = 100000; // 100ms in microseconds
        return (totalUsage / totalTime) * 100;
    }
    calculatePercentile(percentile) {
        const index = Math.ceil((percentile / 100) * this.responseTimes.length) - 1;
        return this.responseTimes[index];
    }
    updatePrometheusMetrics() {
        // Update CPU metrics
        this.prometheusMetrics.cpuUsage.set(this.metrics.cpu.usage);
        this.prometheusMetrics.cpuLoad.set(this.metrics.cpu.load[0]);
        // Update memory metrics
        this.prometheusMetrics.memoryUsed.set(this.metrics.memory.used);
        this.prometheusMetrics.memoryTotal.set(this.metrics.memory.total);
        this.prometheusMetrics.heapUsed.set(this.metrics.memory.heapUsed);
        this.prometheusMetrics.heapTotal.set(this.metrics.memory.heapTotal);
        // Update response time metrics
        this.prometheusMetrics.responseTimeP50.set(this.metrics.responseTime.p50);
        this.prometheusMetrics.responseTimeP90.set(this.metrics.responseTime.p90);
        this.prometheusMetrics.responseTimeP95.set(this.metrics.responseTime.p95);
        this.prometheusMetrics.responseTimeP99.set(this.metrics.responseTime.p99);
        // Update request metrics
        this.prometheusMetrics.requestsTotal.set(this.metrics.requests.total);
        this.prometheusMetrics.requestsSuccess.set(this.metrics.requests.success);
        this.prometheusMetrics.requestsError.set(this.metrics.requests.error);
        this.prometheusMetrics.requestsRate.set(this.metrics.requests.rate);
    }
    recordResponseTime(responseTime) {
        this.responseTimes.push(responseTime);
        // Keep only last 1000 response times to prevent memory issues
        if (this.responseTimes.length > 1000) {
            this.responseTimes.shift();
        }
    }
    recordRequest(success) {
        this.metrics.requests.total++;
        if (success) {
            this.metrics.requests.success++;
        }
        else {
            this.metrics.requests.error++;
        }
    }
    getMetrics() {
        return { ...this.metrics };
    }
    stop() {
        clearInterval(this.collectionInterval);
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
// Prometheus metrics
const prometheusMetrics = {
    cpuUsage: new prom_client_1.promClient.Gauge({
        name: 'cpu_usage_percent',
        help: 'CPU usage percentage'
    }),
    cpuLoad: new prom_client_1.promClient.Gauge({
        name: 'cpu_load_average',
        help: 'CPU load average (1 minute)'
    }),
    memoryUsed: new prom_client_1.promClient.Gauge({
        name: 'memory_used_bytes',
        help: 'Memory used in bytes'
    }),
    memoryTotal: new prom_client_1.promClient.Gauge({
        name: 'memory_total_bytes',
        help: 'Total memory in bytes'
    }),
    heapUsed: new prom_client_1.promClient.Gauge({
        name: 'heap_used_bytes',
        help: 'Heap memory used in bytes'
    }),
    heapTotal: new prom_client_1.promClient.Gauge({
        name: 'heap_total_bytes',
        help: 'Total heap memory in bytes'
    }),
    responseTimeP50: new prom_client_1.promClient.Gauge({
        name: 'response_time_p50_ms',
        help: '50th percentile of response time in milliseconds'
    }),
    responseTimeP90: new prom_client_1.promClient.Gauge({
        name: 'response_time_p90_ms',
        help: '90th percentile of response time in milliseconds'
    }),
    responseTimeP95: new prom_client_1.promClient.Gauge({
        name: 'response_time_p95_ms',
        help: '95th percentile of response time in milliseconds'
    }),
    responseTimeP99: new prom_client_1.promClient.Gauge({
        name: 'response_time_p99_ms',
        help: '99th percentile of response time in milliseconds'
    }),
    requestsTotal: new prom_client_1.promClient.Counter({
        name: 'requests_total',
        help: 'Total number of requests'
    }),
    requestsSuccess: new prom_client_1.promClient.Counter({
        name: 'requests_success_total',
        help: 'Total number of successful requests'
    }),
    requestsError: new prom_client_1.promClient.Counter({
        name: 'requests_error_total',
        help: 'Total number of failed requests'
    }),
    requestsRate: new prom_client_1.promClient.Gauge({
        name: 'requests_per_second',
        help: 'Number of requests per second'
    })
};
//# sourceMappingURL=performanceMonitor.js.map