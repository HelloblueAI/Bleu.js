"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const modelMonitor_1 = require("../modelMonitor");
const deepLearning_1 = require("../../ai/deepLearning");
const globals_1 = require("@jest/globals");
// Mock dependencies
globals_1.jest.mock('../../ai/deepLearning');
globals_1.jest.useFakeTimers();
describe('ModelMonitor', () => {
    let monitor;
    let mockModel;
    beforeEach(() => {
        mockModel = {
            predict: globals_1.jest.fn(),
            dispose: globals_1.jest.fn()
        };
        deepLearning_1.DeepLearningModel.mockImplementation(() => mockModel);
        monitor = new modelMonitor_1.ModelMonitor(mockModel);
    });
    afterEach(() => {
        globals_1.jest.clearAllMocks();
        globals_1.jest.clearAllTimers();
    });
    describe('initialization', () => {
        it('should initialize with default configuration', () => {
            expect(monitor).toBeDefined();
            expect(mockModel).toBeDefined();
        });
        it('should initialize with custom configuration', () => {
            const customConfig = {
                enabled: false,
                metrics: ['accuracy', 'latency'],
                alertThresholds: {
                    accuracy: 0.9,
                    latency: 500,
                    errorRate: 0.1
                },
                retentionPeriod: 24 * 60 * 60 * 1000, // 1 day
                samplingRate: 0.5
            };
            const customMonitor = new modelMonitor_1.ModelMonitor(mockModel, customConfig);
            expect(customMonitor).toBeDefined();
        });
    });
    describe('monitoring lifecycle', () => {
        it('should start monitoring', async () => {
            await monitor.startMonitoring();
            // Fast-forward timers to trigger metric collection
            globals_1.jest.advanceTimersByTime(60000);
            expect(monitor.getLatestMetrics()).toBeDefined();
        });
        it('should stop monitoring', async () => {
            await monitor.startMonitoring();
            monitor.stopMonitoring();
            // Fast-forward timers to verify no more collection
            globals_1.jest.advanceTimersByTime(60000);
            const metrics = monitor.getLatestMetrics();
            expect(metrics).toBeNull();
        });
    });
    describe('metric collection', () => {
        beforeEach(async () => {
            await monitor.startMonitoring();
        });
        it('should collect metrics', async () => {
            mockModel.predict.mockResolvedValueOnce([0.8]);
            // Fast-forward timers to trigger collection
            globals_1.jest.advanceTimersByTime(60000);
            const metrics = monitor.getLatestMetrics();
            expect(metrics).toBeDefined();
            expect(metrics?.accuracy).toBeDefined();
            expect(metrics?.latency).toBeDefined();
            expect(metrics?.errorRate).toBeDefined();
            expect(metrics?.throughput).toBeDefined();
            expect(metrics?.memoryUsage).toBeDefined();
        });
        it('should handle collection errors gracefully', async () => {
            mockModel.predict.mockRejectedValueOnce(new Error('Prediction error'));
            // Fast-forward timers to trigger collection
            globals_1.jest.advanceTimersByTime(60000);
            const metrics = monitor.getLatestMetrics();
            expect(metrics).toBeDefined();
            expect(metrics?.latency).toBe(Infinity);
        });
    });
    describe('alert system', () => {
        beforeEach(async () => {
            await monitor.startMonitoring();
        });
        it('should create alerts for low accuracy', async () => {
            // Mock metrics with low accuracy
            const mockMetrics = {
                timestamp: new Date(),
                accuracy: 0.85,
                latency: 100,
                errorRate: 0.02,
                throughput: 100,
                memoryUsage: 100
            };
            // @ts-ignore - accessing private method for testing
            await monitor.collectMetrics.call(monitor);
            const alerts = monitor.getLatestAlerts();
            expect(alerts).toHaveLength(1);
            expect(alerts[0].type).toBe('accuracy');
            expect(alerts[0].severity).toBe('high');
        });
        it('should create alerts for high latency', async () => {
            // Mock metrics with high latency
            const mockMetrics = {
                timestamp: new Date(),
                accuracy: 0.95,
                latency: 2000,
                errorRate: 0.02,
                throughput: 100,
                memoryUsage: 100
            };
            // @ts-ignore - accessing private method for testing
            await monitor.collectMetrics.call(monitor);
            const alerts = monitor.getLatestAlerts();
            expect(alerts).toHaveLength(1);
            expect(alerts[0].type).toBe('latency');
            expect(alerts[0].severity).toBe('high');
        });
    });
    describe('data management', () => {
        beforeEach(async () => {
            await monitor.startMonitoring();
        });
        it('should get metrics within time range', () => {
            const now = new Date();
            const start = new Date(now.getTime() - 3600000); // 1 hour ago
            const end = new Date(now.getTime() + 3600000); // 1 hour ahead
            const metrics = monitor.getMetrics({ start, end });
            expect(Array.isArray(metrics)).toBe(true);
        });
        it('should get alerts within time range', () => {
            const now = new Date();
            const start = new Date(now.getTime() - 3600000);
            const end = new Date(now.getTime() + 3600000);
            const alerts = monitor.getAlerts({ start, end });
            expect(Array.isArray(alerts)).toBe(true);
        });
        it('should get latest metrics', () => {
            const metrics = monitor.getLatestMetrics();
            expect(metrics).toBeDefined();
        });
        it('should get latest alerts', () => {
            const alerts = monitor.getLatestAlerts(5);
            expect(Array.isArray(alerts)).toBe(true);
            expect(alerts.length).toBeLessThanOrEqual(5);
        });
    });
    describe('metrics summary', () => {
        beforeEach(async () => {
            await monitor.startMonitoring();
        });
        it('should calculate metrics summary', () => {
            const summary = monitor.getMetricsSummary();
            expect(summary).toEqual({
                averageAccuracy: expect.any(Number),
                averageLatency: expect.any(Number),
                averageErrorRate: expect.any(Number),
                averageThroughput: expect.any(Number),
                averageMemoryUsage: expect.any(Number)
            });
        });
        it('should handle empty metrics for summary', () => {
            // Clear metrics
            // @ts-ignore - accessing private property for testing
            monitor.metrics = [];
            const summary = monitor.getMetricsSummary();
            expect(summary).toEqual({
                averageAccuracy: 0,
                averageLatency: 0,
                averageErrorRate: 0,
                averageThroughput: 0,
                averageMemoryUsage: 0
            });
        });
    });
    describe('cleanup', () => {
        beforeEach(async () => {
            await monitor.startMonitoring();
        });
        it('should clean up old data', () => {
            // Add old metrics
            // @ts-ignore - accessing private property for testing
            monitor.metrics = [
                {
                    timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days old
                    accuracy: 0.95,
                    latency: 100,
                    errorRate: 0.02,
                    throughput: 100,
                    memoryUsage: 100
                }
            ];
            // Fast-forward timers to trigger cleanup
            globals_1.jest.advanceTimersByTime(24 * 60 * 60 * 1000);
            const metrics = monitor.getMetrics();
            expect(metrics).toHaveLength(0);
        });
    });
});
//# sourceMappingURL=modelMonitor.test.js.map