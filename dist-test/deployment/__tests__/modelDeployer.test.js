"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const modelDeployer_1 = require("../modelDeployer");
const deepLearning_1 = require("../../ai/deepLearning");
const express_1 = __importDefault(require("express"));
// Mock dependencies
jest.mock('../../ai/deepLearning');
jest.mock('express', () => {
    const mockExpress = () => {
        const app = {
            use: jest.fn(),
            get: jest.fn(),
            post: jest.fn(),
            listen: jest.fn()
        };
        return app;
    };
    mockExpress.json = jest.fn();
    mockExpress.urlencoded = jest.fn();
    return mockExpress;
});
describe('ModelDeployer', () => {
    let deployer;
    let mockApp;
    let mockModel;
    beforeEach(() => {
        mockModel = {
            load: jest.fn(),
            predict: jest.fn(),
            dispose: jest.fn()
        };
        deepLearning_1.DeepLearningModel.mockImplementation(() => mockModel);
        mockApp = (0, express_1.default)();
        deployer = new modelDeployer_1.ModelDeployer();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('initialization', () => {
        it('should initialize with default configuration', () => {
            expect(deployer).toBeDefined();
            expect(mockModel).toBeDefined();
        });
        it('should initialize with custom configuration', () => {
            const customConfig = {
                port: 8080,
                host: 'localhost',
                modelPath: '/custom/path',
                batchSize: 64,
                maxRequests: 2000,
                timeout: 60000,
                cors: false,
                rateLimit: {
                    windowMs: 30 * 60 * 1000,
                    max: 200
                },
                monitoring: {
                    enabled: false,
                    metrics: ['requests']
                }
            };
            const customDeployer = new modelDeployer_1.ModelDeployer(customConfig);
            expect(customDeployer).toBeDefined();
        });
    });
    describe('initialize', () => {
        it('should initialize the deployment server', async () => {
            await deployer.initialize();
            expect(mockModel.load).toHaveBeenCalledWith('./models');
            expect(mockApp.use).toHaveBeenCalled();
            expect(mockApp.get).toHaveBeenCalled();
            expect(mockApp.post).toHaveBeenCalled();
        });
        it('should handle initialization errors', async () => {
            mockModel.load.mockRejectedValueOnce(new Error('Load error'));
            await expect(deployer.initialize()).rejects.toThrow('Load error');
        });
    });
    describe('middleware setup', () => {
        beforeEach(async () => {
            await deployer.initialize();
        });
        it('should set up body parser middleware', () => {
            expect(mockApp.use).toHaveBeenCalledWith(express_1.default.json());
            expect(mockApp.use).toHaveBeenCalledWith(express_1.default.urlencoded());
        });
        it('should set up CORS middleware when enabled', () => {
            const corsMiddleware = mockApp.use.mock.calls.find(call => call[0].toString().includes('Access-Control-Allow-Origin'));
            expect(corsMiddleware).toBeDefined();
        });
        it('should set up request logging middleware', () => {
            const loggingMiddleware = mockApp.use.mock.calls.find(call => call[0].toString().includes('start = Date.now()'));
            expect(loggingMiddleware).toBeDefined();
        });
    });
    describe('routes', () => {
        beforeEach(async () => {
            await deployer.initialize();
        });
        it('should set up health check endpoint', () => {
            const healthCheckRoute = mockApp.get.mock.calls.find(call => call[0] === '/health');
            expect(healthCheckRoute).toBeDefined();
        });
        it('should set up metrics endpoint', () => {
            const metricsRoute = mockApp.get.mock.calls.find(call => call[0] === '/metrics');
            expect(metricsRoute).toBeDefined();
        });
        it('should set up prediction endpoint', () => {
            const predictRoute = mockApp.post.mock.calls.find(call => call[0] === '/predict');
            expect(predictRoute).toBeDefined();
        });
        it('should set up model update endpoint', () => {
            const updateRoute = mockApp.post.mock.calls.find(call => call[0] === '/update');
            expect(updateRoute).toBeDefined();
        });
    });
    describe('server management', () => {
        it('should start the server', async () => {
            const mockServer = {
                close: jest.fn(callback => callback())
            };
            mockApp.listen.mockReturnValueOnce(mockServer);
            await deployer.start();
            expect(mockApp.listen).toHaveBeenCalledWith(3000, '0.0.0.0', expect.any(Function));
        });
        it('should stop the server gracefully', async () => {
            const mockServer = {
                close: jest.fn(callback => callback())
            };
            mockApp.listen.mockReturnValueOnce(mockServer);
            await deployer.start();
            await deployer.stop();
            expect(mockServer.close).toHaveBeenCalled();
        });
    });
    describe('model operations', () => {
        it('should update model', async () => {
            const modelPath = '/new/model/path';
            await deployer.updateModel(modelPath);
            expect(mockModel.load).toHaveBeenCalledWith(modelPath);
        });
        it('should make predictions', async () => {
            const features = [[1, 2, 3]];
            const predictions = [0.8];
            mockModel.predict.mockResolvedValueOnce(predictions);
            const result = await deployer.predict(features);
            expect(result).toEqual(predictions);
            expect(mockModel.predict).toHaveBeenCalledWith(features);
        });
    });
    describe('metrics', () => {
        it('should track request metrics', async () => {
            const metrics = deployer.getMetrics();
            expect(metrics).toEqual({
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                averageResponseTime: 0,
                modelLoadTime: expect.any(Number),
                lastModelUpdate: expect.any(Date)
            });
        });
    });
    describe('error handling', () => {
        it('should handle prediction errors', async () => {
            mockModel.predict.mockRejectedValueOnce(new Error('Prediction error'));
            await expect(deployer.predict([[1, 2, 3]])).rejects.toThrow('Prediction error');
        });
        it('should handle model update errors', async () => {
            mockModel.load.mockRejectedValueOnce(new Error('Update error'));
            await expect(deployer.updateModel('/path')).rejects.toThrow('Update error');
        });
    });
});
//# sourceMappingURL=modelDeployer.test.js.map