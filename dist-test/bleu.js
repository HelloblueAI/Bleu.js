"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bleu = void 0;
const bleuAI_1 = require("./ai/models/bleuAI");
const modelMonitor_1 = require("./monitoring/modelMonitor");
const modelDeployer_1 = require("./deployment/modelDeployer");
const securityAnalyzer_1 = require("./security/securityAnalyzer");
const performanceOptimizer_1 = require("./optimization/performanceOptimizer");
const clusterManager_1 = require("./cluster/clusterManager");
const logger_1 = require("./utils/logger");
class Bleu {
    constructor(config = {}) {
        this.model = null;
        this.logger = (0, logger_1.createLogger)('Bleu');
        this.config = {
            modelPath: config.modelPath || './models',
            architecture: {
                type: config.architecture?.type || 'transformer',
                layers: config.architecture?.layers || 12,
                attentionHeads: config.architecture?.attentionHeads || 8,
                hiddenSize: config.architecture?.hiddenSize || 768,
                vocabularySize: config.architecture?.vocabularySize || 50000,
                maxSequenceLength: config.architecture?.maxSequenceLength || 2048,
                useQuantumComputing: config.architecture?.useQuantumComputing || false,
                enableMultiModal: config.architecture?.enableMultiModal || false,
                enableReinforcementLearning: config.architecture?.enableReinforcementLearning || false
            },
            cluster: {
                enabled: config.cluster?.enabled || false,
                nodes: config.cluster?.nodes || 1,
                autoScale: config.cluster?.autoScale || false
            },
            security: {
                encryptionLevel: config.security?.encryptionLevel || 'standard',
                enableAuditLogging: config.security?.enableAuditLogging || true,
                enableThreatDetection: config.security?.enableThreatDetection || true
            },
            performance: {
                enableGPU: config.performance?.enableGPU || true,
                enableTPU: config.performance?.enableTPU || false,
                enableDistributedTraining: config.performance?.enableDistributedTraining || false,
                enableAutoOptimization: config.performance?.enableAutoOptimization || true
            }
        };
        this.monitor = new modelMonitor_1.ModelMonitor();
        this.deployer = new modelDeployer_1.ModelDeployer();
        this.securityAnalyzer = new securityAnalyzer_1.SecurityAnalyzer();
        this.performanceOptimizer = new performanceOptimizer_1.PerformanceOptimizer();
        this.clusterManager = new clusterManager_1.ClusterManager();
    }
    async initialize() {
        this.logger.info('Initializing Bleu AI with advanced capabilities...');
        if (!this.model) {
            this.model = new bleuAI_1.BleuAI(this.config);
            await this.model.initialize();
        }
        if (this.config.cluster.enabled) {
            await this.clusterManager.initialize(this.config.cluster);
        }
        await this.monitor.initialize();
        await this.deployer.initialize();
        await this.securityAnalyzer.initialize();
        await this.performanceOptimizer.initialize();
        this.logger.info('Bleu AI initialized successfully with all advanced features enabled');
        return this;
    }
    async process(input, options = {}) {
        if (!this.model) {
            await this.initialize();
        }
        const startTime = Date.now();
        this.logger.info('Processing input with advanced AI capabilities...');
        const result = await this.model.generate({
            prompt: input,
            maxTokens: options.maxTokens,
            temperature: options.temperature,
            topP: options.topP,
            useQuantumComputing: options.useQuantumComputing,
            enableMultiModal: options.enableMultiModal,
            enableReinforcementLearning: options.enableReinforcementLearning
        });
        const processingTime = Date.now() - startTime;
        this.logger.info(`Processing completed in ${processingTime}ms`);
        return result;
    }
    async analyzeCode(code) {
        if (!this.model) {
            await this.initialize();
        }
        this.logger.info('Starting comprehensive code analysis...');
        const [modelAnalysis, securityAnalysis, performanceAnalysis] = await Promise.all([
            this.model.analyzeCode(code),
            this.securityAnalyzer.analyze(code),
            this.performanceOptimizer.analyze(code)
        ]);
        const result = {
            codeQuality: modelAnalysis.quality,
            securityScore: securityAnalysis.score,
            performanceScore: performanceAnalysis.score,
            maintainabilityScore: modelAnalysis.maintainability,
            recommendations: [
                ...modelAnalysis.recommendations,
                ...securityAnalysis.recommendations,
                ...performanceAnalysis.recommendations
            ],
            quantumOptimizations: this.config.architecture.useQuantumComputing
                ? await this.model.getQuantumOptimizations(code)
                : undefined,
            threatAnalysis: this.config.security.enableThreatDetection
                ? await this.securityAnalyzer.getThreatAnalysis(code)
                : undefined
        };
        this.logger.info('Code analysis completed successfully');
        return result;
    }
    async optimizePerformance() {
        if (!this.model) {
            await this.initialize();
        }
        this.logger.info('Starting performance optimization...');
        await this.performanceOptimizer.optimize(this.model);
        this.logger.info('Performance optimization completed');
    }
    async deployModel() {
        if (!this.model) {
            await this.initialize();
        }
        this.logger.info('Starting model deployment...');
        await this.deployer.deploy(this.model);
        this.logger.info('Model deployed successfully');
    }
    async monitorHealth() {
        return await this.monitor.getHealthMetrics();
    }
    dispose() {
        this.logger.info('Disposing of Bleu AI resources...');
        if (this.model) {
            this.model.dispose();
            this.model = null;
        }
        this.monitor.dispose();
        this.deployer.dispose();
        this.securityAnalyzer.dispose();
        this.performanceOptimizer.dispose();
        this.clusterManager.dispose();
        this.logger.info('All resources disposed successfully');
    }
}
exports.Bleu = Bleu;
//# sourceMappingURL=bleu.js.map