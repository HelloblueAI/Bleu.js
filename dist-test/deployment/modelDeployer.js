"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelDeployer = void 0;
const winston_1 = require("winston");
const express_1 = __importDefault(require("express"));
const deepLearning_1 = require("../ai/deepLearning");
class ModelDeployer {
    constructor(config = {
        port: 3000,
        host: '0.0.0.0',
        modelPath: './models',
        batchSize: 32,
        maxRequests: 1000,
        timeout: 30000,
        cors: true,
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100 // limit each IP to 100 requests per windowMs
        },
        monitoring: {
            enabled: true,
            metrics: ['requests', 'latency', 'errors']
        }
    }) {
        this.logger = (0, winston_1.createLogger)({
            level: 'info',
            format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json()),
            transports: [new winston_1.transports.Console()]
        });
        this.config = config;
        this.app = (0, express_1.default)();
        this.model = new deepLearning_1.DeepLearningModel();
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            modelLoadTime: 0,
            lastModelUpdate: new Date()
        };
    }
    async initialize() {
        try {
            this.logger.info('Initializing model deployment...');
            // Load the model
            const startTime = Date.now();
            await this.model.load(this.config.modelPath);
            this.metrics.modelLoadTime = Date.now() - startTime;
            // Setup middleware
            this.setupMiddleware();
            // Setup routes
            this.setupRoutes();
            this.logger.info('Model deployment initialized successfully');
        }
        catch (error) {
            this.logger.error('Error initializing model deployment:', error);
            throw error;
        }
    }
    setupMiddleware() {
        // Body parser
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // CORS
        if (this.config.cors) {
            this.app.use((req, res, next) => {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
                res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
                next();
            });
        }
        // Request logging
        this.app.use((req, res, next) => {
            const start = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - start;
                this.logger.info({
                    method: req.method,
                    path: req.path,
                    status: res.statusCode,
                    duration
                });
            });
            next();
        });
        // Error handling
        this.app.use((err, req, res, next) => {
            this.logger.error('Error processing request:', err);
            res.status(500).json({
                error: 'Internal Server Error',
                message: err.message
            });
        });
    }
    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                modelLoaded: !!this.model,
                uptime: process.uptime()
            });
        });
        // Model metrics endpoint
        this.app.get('/metrics', (req, res) => {
            res.json(this.metrics);
        });
        // Prediction endpoint
        this.app.post('/predict', async (req, res) => {
            try {
                const startTime = Date.now();
                this.metrics.totalRequests++;
                const { features } = req.body;
                if (!features || !Array.isArray(features)) {
                    throw new Error('Invalid input format');
                }
                const predictions = await this.model.predict(features);
                const responseTime = Date.now() - startTime;
                this.metrics.successfulRequests++;
                this.metrics.averageResponseTime =
                    (this.metrics.averageResponseTime * (this.metrics.successfulRequests - 1) + responseTime) /
                        this.metrics.successfulRequests;
                res.json({
                    predictions,
                    responseTime
                });
            }
            catch (error) {
                this.metrics.failedRequests++;
                this.logger.error('Prediction error:', error);
                res.status(400).json({
                    error: 'Prediction Error',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        // Model update endpoint
        this.app.post('/update', async (req, res) => {
            try {
                const { modelPath } = req.body;
                if (!modelPath) {
                    throw new Error('Model path is required');
                }
                await this.model.load(modelPath);
                this.metrics.lastModelUpdate = new Date();
                res.json({
                    message: 'Model updated successfully',
                    timestamp: this.metrics.lastModelUpdate
                });
            }
            catch (error) {
                this.logger.error('Model update error:', error);
                res.status(400).json({
                    error: 'Update Error',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    async start() {
        try {
            this.logger.info('Starting model deployment server...');
            this.server = this.app.listen(this.config.port, this.config.host, () => {
                this.logger.info(`Server running at http://${this.config.host}:${this.config.port}`);
            });
            // Handle graceful shutdown
            process.on('SIGTERM', () => {
                this.logger.info('SIGTERM received. Shutting down gracefully...');
                this.stop();
            });
        }
        catch (error) {
            this.logger.error('Error starting server:', error);
            throw error;
        }
    }
    async stop() {
        try {
            if (this.server) {
                await new Promise((resolve) => {
                    this.server.close(() => {
                        this.logger.info('Server stopped');
                        resolve();
                    });
                });
            }
        }
        catch (error) {
            this.logger.error('Error stopping server:', error);
            throw error;
        }
    }
    getMetrics() {
        return { ...this.metrics };
    }
    async updateModel(modelPath) {
        try {
            this.logger.info('Updating model...');
            await this.model.load(modelPath);
            this.metrics.lastModelUpdate = new Date();
            this.logger.info('Model updated successfully');
        }
        catch (error) {
            this.logger.error('Error updating model:', error);
            throw error;
        }
    }
    async predict(features) {
        try {
            return await this.model.predict(features);
        }
        catch (error) {
            this.logger.error('Error making prediction:', error);
            throw error;
        }
    }
}
exports.ModelDeployer = ModelDeployer;
//# sourceMappingURL=modelDeployer.js.map