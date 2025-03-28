"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedDecisionTree = void 0;
const logger_1 = require("../utils/logger");
class AdvancedDecisionTree {
    constructor(config = {}) {
        this.model = null;
        this.logger = (0, logger_1.createLogger)('DecisionTree');
        this.config = {
            maxDepth: config.maxDepth ?? 5,
            minSamplesSplit: config.minSamplesSplit ?? 2,
            minSamplesLeaf: config.minSamplesLeaf ?? 1,
            criterion: config.criterion ?? 'gini',
            randomState: config.randomState ?? 42
        };
        this.quantumEnhancer = new QuantumEnhancer();
        this.uncertaintyHandler = new UncertaintyHandler();
        this.featureAnalyzer = new FeatureAnalyzer();
        this.ensembleManager = new EnsembleManager();
        this.explainabilityEngine = new ExplainabilityEngine();
    }
    async initialize() {
        this.logger.info('Initializing Advanced Decision Tree with quantum-enhanced capabilities...');
        // Initialize advanced components
        await this.quantumEnhancer.initialize();
        await this.uncertaintyHandler.initialize();
        await this.featureAnalyzer.initialize();
        await this.ensembleManager.initialize();
        await this.explainabilityEngine.initialize();
        this.logger.info('Advanced Decision Tree initialized successfully');
    }
    async train(data) {
        try {
            // Analyze feature importance
            const featureImportance = await this.featureAnalyzer.analyze(data.features, data.labels);
            // Create ensemble of trees
            const trees = await this.ensembleManager.createEnsemble(data.features, data.labels, featureImportance);
            // Apply quantum enhancement to each tree
            const quantumEnhancedTrees = await Promise.all(trees.map(tree => this.quantumEnhancer.enhance(tree)));
            // Combine trees with uncertainty handling
            this.model = await this.uncertaintyHandler.combineTrees(quantumEnhancedTrees);
            // Generate explanations
            await this.explainabilityEngine.generateExplanations(this.model, data.features, data.labels);
            this.logger.info('Advanced Decision Tree trained successfully');
        }
        catch (error) {
            this.logger.error('Error training decision tree:', error);
            throw error;
        }
    }
    async predict(features) {
        if (!this.model) {
            throw new Error('Model not trained. Call train() first.');
        }
        try {
            // Process each feature set
            const predictions = await Promise.all(features.map(feature => this.predictSingle(feature)));
            // Apply quantum optimization to predictions
            const optimizedPredictions = await this.quantumEnhancer.optimizePredictions(predictions);
            // Handle uncertainty in predictions
            const uncertaintyAdjustedPredictions = await this.uncertaintyHandler.adjustPredictions(optimizedPredictions);
            return uncertaintyAdjustedPredictions;
        }
        catch (error) {
            this.logger.error('Error making predictions:', error);
            throw error;
        }
    }
    async predictSingle(feature) {
        if (!this.model) {
            throw new Error('Model not trained');
        }
        // Get base prediction
        const basePrediction = this.traverseTree(feature, this.model);
        // Get feature importance
        const importance = await this.featureAnalyzer.getFeatureImportance(feature);
        // Get uncertainty metrics
        const uncertainty = await this.uncertaintyHandler.calculateUncertainty(feature);
        // Get explanation
        const explanation = await this.explainabilityEngine.getExplanation(feature);
        return {
            prediction: basePrediction,
            confidence: 1 - uncertainty,
            featureImportance: importance,
            explanation,
            metadata: {
                processingTime: Date.now(),
                modelVersion: this.config.randomState
            }
        };
    }
    traverseTree(feature, node) {
        if (node.value !== undefined) {
            return node.value;
        }
        if (node.featureIndex === undefined || node.threshold === undefined || !node.left || !node.right) {
            throw new Error('Invalid node structure');
        }
        const value = feature[node.featureIndex];
        if (value <= node.threshold) {
            return this.traverseTree(feature, node.left);
        }
        else {
            return this.traverseTree(feature, node.right);
        }
    }
    async getFeatureImportance() {
        if (!this.model) {
            throw new Error('Model not trained');
        }
        return this.featureAnalyzer.getGlobalFeatureImportance();
    }
    async getUncertaintyMetrics() {
        if (!this.model) {
            throw new Error('Model not trained');
        }
        return this.uncertaintyHandler.getMetrics();
    }
    async getExplanations(features) {
        if (!this.model) {
            throw new Error('Model not trained');
        }
        return Promise.all(features.map(feature => this.explainabilityEngine.getExplanation(feature)));
    }
    dispose() {
        this.model = null;
        this.quantumEnhancer.dispose();
        this.uncertaintyHandler.dispose();
        this.featureAnalyzer.dispose();
        this.ensembleManager.dispose();
        this.explainabilityEngine.dispose();
    }
    evaluate(features, labels) {
        const predictions = this.predict(features);
        const tp = {};
        const fp = {};
        const fn = {};
        const uniqueLabels = Array.from(new Set(labels));
        uniqueLabels.forEach(label => {
            tp[label] = 0;
            fp[label] = 0;
            fn[label] = 0;
        });
        predictions.forEach((pred, i) => {
            const actual = labels[i];
            if (pred === actual) {
                tp[pred]++;
            }
            else {
                fp[pred]++;
                fn[actual]++;
            }
        });
        const accuracy = predictions.filter((p, i) => p === labels[i]).length / predictions.length;
        const metrics = { accuracy };
        uniqueLabels.forEach(label => {
            const precision = tp[label] / (tp[label] + fp[label]) || 0;
            const recall = tp[label] / (tp[label] + fn[label]) || 0;
            const f1 = 2 * (precision * recall) / (precision + recall) || 0;
            metrics[`precision_${label}`] = precision;
            metrics[`recall_${label}`] = recall;
            metrics[`f1_${label}`] = f1;
        });
        return metrics;
    }
}
exports.AdvancedDecisionTree = AdvancedDecisionTree;
exports.default = AdvancedDecisionTree;
//# sourceMappingURL=decisionTree.js.map