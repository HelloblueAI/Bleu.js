"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bleu = void 0;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const promClient = __importStar(require("prom-client"));
const config_1 = require("../types/config");
const logger_1 = require("../utils/logger");
const bleuAI_1 = require("../ai/models/bleuAI");
// Initialize Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });
class Bleu {
    constructor(config = {}) {
        this.server = null;
        this.model = null;
        this.config = {
            ...config_1.DEFAULT_CONFIG,
            ...config,
            core: {
                ...config_1.DEFAULT_CONFIG.core,
                ...config.core
            }
        };
        this.app = (0, express_1.default)();
        this.logger = (0, logger_1.createLogger)(this.config.core.logLevel);
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    setupMiddleware() {
        // Security middleware
        this.app.use((0, helmet_1.default)());
        this.app.use((0, cors_1.default)());
        this.app.use((0, compression_1.default)());
        this.app.use(express_1.default.json());
        // Rate limiting
        const limiter = (0, express_rate_limit_1.default)({
            windowMs: this.config.core.rateLimitWindow,
            max: this.config.core.rateLimitMax,
            standardHeaders: true,
            legacyHeaders: false,
            keyGenerator: (req) => req.ip
        });
        this.app.use(limiter);
        // Request logging
        this.app.use((req, res, next) => {
            this.logger.info('Incoming request', {
                method: req.method,
                path: req.path,
                ip: req.ip
            });
            next();
        });
    }
    setupRoutes() {
        this.app.get('/health', (req, res) => {
            res.json({ status: 'ok' });
        });
        this.app.get('/metrics', async (req, res) => {
            try {
                const metrics = await register.metrics();
                res.set('Content-Type', register.contentType);
                res.end(metrics);
            }
            catch (error) {
                this.logger.error('Error collecting metrics', { error });
                res.status(500).json({ error: 'Failed to collect metrics' });
            }
        });
        // Add more routes here
    }
    setupErrorHandling() {
        this.app.use((err, req, res, next) => {
            this.logger.error('Unhandled error', { error: err });
            res.status(500).json({
                error: {
                    message: this.config.core.environment === 'development' ? err.message : 'Internal server error',
                    environment: this.config.core.environment
                }
            });
        });
    }
    async start() {
        try {
            // Initialize model
            this.model = new bleuAI_1.BleuAI(this.config);
            await this.model.initialize();
            // Start server
            this.server = this.app.listen(this.config.core.port, () => {
                this.logger.info(`🚀 Server running on port ${this.config.core.port} in ${this.config.core.environment} mode`);
            });
        }
        catch (error) {
            this.logger.error('Failed to start server', { error });
            throw error;
        }
    }
    async stop() {
        try {
            if (this.server) {
                await new Promise((resolve, reject) => {
                    this.server?.close((err) => {
                        if (err)
                            reject(err);
                        else
                            resolve();
                    });
                });
            }
            if (this.model) {
                await this.model.dispose();
            }
            this.logger.info('Server stopped');
        }
        catch (error) {
            this.logger.error('Error stopping server', { error });
            throw error;
        }
    }
}
exports.Bleu = Bleu;
//# sourceMappingURL=Bleu.js.map