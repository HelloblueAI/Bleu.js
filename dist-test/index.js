"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.DEFAULT_CONFIG = exports.modelMonitor = exports.modelDeployer = exports.nlpProcessor = exports.deepLearning = exports.decisionTree = exports.monitoring = exports.BleuX = exports.Bleu = void 0;
exports.createBleuApp = createBleuApp;
// Core exports
var Bleu_1 = require("./core/Bleu");
Object.defineProperty(exports, "Bleu", { enumerable: true, get: function () { return Bleu_1.Bleu; } });
var BleuX_1 = require("./core/BleuX");
Object.defineProperty(exports, "BleuX", { enumerable: true, get: function () { return BleuX_1.BleuX; } });
var monitoring_1 = require("./core/monitoring");
Object.defineProperty(exports, "monitoring", { enumerable: true, get: function () { return monitoring_1.monitoring; } });
// AI/ML exports
var decisionTree_1 = require("./ai/decisionTree");
Object.defineProperty(exports, "decisionTree", { enumerable: true, get: function () { return decisionTree_1.decisionTree; } });
var deepLearning_1 = require("./ai/deepLearning");
Object.defineProperty(exports, "deepLearning", { enumerable: true, get: function () { return deepLearning_1.deepLearning; } });
var nlpProcessor_1 = require("./ai/nlpProcessor");
Object.defineProperty(exports, "nlpProcessor", { enumerable: true, get: function () { return nlpProcessor_1.nlpProcessor; } });
// Deployment exports
var modelDeployer_1 = require("./deployment/modelDeployer");
Object.defineProperty(exports, "modelDeployer", { enumerable: true, get: function () { return modelDeployer_1.modelDeployer; } });
// Monitoring exports
var modelMonitor_1 = require("./monitoring/modelMonitor");
Object.defineProperty(exports, "modelMonitor", { enumerable: true, get: function () { return modelMonitor_1.modelMonitor; } });
// Default configuration
exports.DEFAULT_CONFIG = {
    apiKey: '',
    version: 'v2',
    timeout: 30000,
    retries: 3,
    model: 'bleu-ai',
    temperature: 0.7,
    maxTokens: 2000
};
// Version
exports.VERSION = '1.1.2';
// Quick start helper
async function createBleuApp(config = {}) {
    const mergedConfig = {
        ...exports.DEFAULT_CONFIG,
        ...config
    };
    const app = new Bleu(mergedConfig);
    await app.start();
    return app;
}
const nlpProcessor_2 = require("./ai/nlpProcessor");
const codeAnalyzer_1 = require("./ai/codeAnalyzer");
const HenFarm_1 = require("./eggs-generator/src/HenFarm");
class Bleu {
    constructor(config) {
        this.config = {
            version: 'v2',
            timeout: 30000,
            retries: 3,
            model: 'bleu-ai',
            temperature: 0.7,
            maxTokens: 2000,
            ...config
        };
        this.nlpProcessor = new nlpProcessor_2.AdvancedNLPProcessor({
            model: this.config.model,
            temperature: this.config.temperature,
            maxTokens: this.config.maxTokens
        });
        this.codeAnalyzer = new codeAnalyzer_1.AdvancedCodeAnalyzer({
            model: this.config.model,
            temperature: this.config.temperature,
            maxTokens: this.config.maxTokens
        });
        this.henFarm = new HenFarm_1.HenFarm({
            model: this.config.model,
            temperature: this.config.temperature,
            maxTokens: this.config.maxTokens
        });
    }
    async process(input) {
        try {
            if (typeof input === 'string') {
                // Process text input
                return await this.nlpProcessor.analyzeText(input);
            }
            else if (typeof input === 'object') {
                // Process code input
                return await this.codeAnalyzer.analyzeCode(JSON.stringify(input));
            }
            throw new Error('Invalid input type');
        }
        catch (error) {
            console.error('Error processing input:', error);
            throw error;
        }
    }
    async generateCode(prompt, options = {}) {
        return await this.henFarm.generateCode(prompt, options);
    }
    async analyzeCode(code, options = {}) {
        return await this.henFarm.analyzeCode(code, options);
    }
}
exports.Bleu = Bleu;
exports.default = Bleu;
//# sourceMappingURL=index.js.map