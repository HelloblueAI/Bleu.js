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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedDecisionTree = void 0;
const tf = __importStar(require("@tensorflow/tfjs"));
const logger_1 = require("../utils/logger");
const enhancer_1 = require("../quantum/enhancer");
const uncertaintyHandler_1 = require("./uncertaintyHandler");
const featureAnalyzer_1 = require("./featureAnalyzer");
const ensembleManager_1 = require("./ensembleManager");
const explainabilityEngine_1 = require("./explainabilityEngine");
class AdvancedDecisionTree {
    constructor(config) {
        this.model = null;
        this.config = config;
        this.quantumEnhancer = new enhancer_1.QuantumEnhancer();
        this.uncertaintyHandler = new uncertaintyHandler_1.UncertaintyHandler();
        this.featureAnalyzer = new featureAnalyzer_1.FeatureAnalyzer();
        this.ensembleManager = new ensembleManager_1.EnsembleManager();
        this.explainabilityEngine = new explainabilityEngine_1.ExplainabilityEngine();
        this.metrics = {
            accuracy: 0,
            uncertainty: 0,
            featureImportance: [],
            ensembleDiversity: 0,
            explainabilityScore: 0
        };
    }
    async initialize() {
        logger_1.logger.info('Initializing Advanced Decision Tree with quantum-enhanced capabilities...');
        try {
            await Promise.all([
                this.quantumEnhancer.initialize(),
                this.uncertaintyHandler.initialize(),
                this.featureAnalyzer.initialize(),
                this.ensembleManager.initialize(),
                this.explainabilityEngine.initialize()
            ]);
            logger_1.logger.info('✅ Advanced Decision Tree initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to initialize Advanced Decision Tree:', error);
            throw error;
        }
    }
    async train(X, y, validationData) {
        try {
            // Analyze feature importance
            if (this.config.enableFeatureAnalysis) {
                const featureImportance = await this.featureAnalyzer.analyze(X, y);
                this.metrics.featureImportance = featureImportance;
            }
            // Create ensemble of trees if enabled
            if (this.config.enableEnsemble) {
                await this.ensembleManager.createEnsemble(X, y);
                this.metrics.ensembleDiversity = await this.ensembleManager.getDiversity();
            }
            // Apply quantum enhancement if enabled
            if (this.config.useQuantumEnhancement) {
                const enhancedX = await this.quantumEnhancer.enhance(X);
                const enhancedY = await this.quantumEnhancer.enhance(y);
                X = enhancedX;
                y = enhancedY;
            }
            // Train the model
            this.model = await this.createModel();
            await this.model.fit(X, y, {
                epochs: 100,
                batchSize: 32,
                validationData,
                callbacks: {
                    onEpochEnd: async (epoch, logs) => {
                        if (logs) {
                            this.metrics.accuracy = logs.acc || 0;
                        }
                    }
                }
            });
            // Handle uncertainty if enabled
            if (this.config.enableUncertaintyHandling) {
                this.metrics.uncertainty = await this.uncertaintyHandler.calculateUncertainty(X);
            }
            // Generate explanations if enabled
            if (this.config.enableExplainability) {
                this.metrics.explainabilityScore = await this.explainabilityEngine.generateExplanation(this.model, X);
            }
            logger_1.logger.info('✅ Model training completed successfully');
        }
        catch (error) {
            logger_1.logger.error('❌ Model training failed:', error);
            throw error;
        }
    }
    async predict(X, returnUncertainty = false) {
        try {
            // Apply quantum enhancement if enabled
            if (this.config.useQuantumEnhancement) {
                X = await this.quantumEnhancer.enhance(X);
            }
            // Get predictions from ensemble if enabled
            let predictions;
            if (this.config.enableEnsemble) {
                predictions = await this.ensembleManager.predict(X);
            }
            else {
                predictions = await this.model.predict(X);
            }
            // Calculate uncertainty if requested
            let uncertainty;
            if (returnUncertainty && this.config.enableUncertaintyHandling) {
                uncertainty = await this.uncertaintyHandler.calculateUncertainty(X);
            }
            // Generate explanations if enabled
            let explanations;
            if (this.config.enableExplainability) {
                explanations = await this.explainabilityEngine.explain(predictions, X);
            }
            return {
                predictions,
                uncertainty,
                explanations
            };
        }
        catch (error) {
            logger_1.logger.error('❌ Prediction failed:', error);
            throw error;
        }
    }
    async createModel() {
        const model = tf.sequential();
        // Add input layer
        model.add(tf.layers.dense({
            units: 64,
            activation: 'relu',
            inputShape: [this.config.maxFeatures]
        }));
        // Add hidden layers
        for (let i = 0; i < this.config.maxDepth; i++) {
            model.add(tf.layers.dense({
                units: 32,
                activation: 'relu'
            }));
            model.add(tf.layers.dropout({ rate: 0.2 }));
        }
        // Add output layer
        model.add(tf.layers.dense({
            units: 1,
            activation: 'sigmoid'
        }));
        // Compile model
        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });
        return model;
    }
    getFeatureImportance() {
        return this.metrics.featureImportance;
    }
    getUncertainty() {
        return this.metrics.uncertainty;
    }
    getEnsembleDiversity() {
        return this.metrics.ensembleDiversity;
    }
    getExplainabilityScore() {
        return this.metrics.explainabilityScore;
    }
    async dispose() {
        if (this.model) {
            this.model.dispose();
            this.model = null;
        }
        await Promise.all([
            this.quantumEnhancer.dispose(),
            this.uncertaintyHandler.dispose(),
            this.featureAnalyzer.dispose(),
            this.ensembleManager.dispose(),
            this.explainabilityEngine.dispose()
        ]);
    }
}
exports.AdvancedDecisionTree = AdvancedDecisionTree;
//# sourceMappingURL=advancedDecisionTree.js.map