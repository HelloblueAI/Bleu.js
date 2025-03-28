"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuantumProcessor = void 0;
const circuit_1 = require("./circuit");
const optimizer_1 = require("./optimizer");
const featureExtractor_1 = require("./featureExtractor");
const stateManager_1 = require("./stateManager");
const noiseHandler_1 = require("./noiseHandler");
const entanglementManager_1 = require("./entanglementManager");
const logger_1 = require("../utils/logger");
class QuantumProcessor {
    constructor() {
        this.circuit = new circuit_1.QuantumCircuit();
        this.optimizer = new optimizer_1.QuantumOptimizer();
        this.featureExtractor = new featureExtractor_1.QuantumFeatureExtractor();
        this.stateManager = new stateManager_1.QuantumStateManager();
        this.noiseHandler = new noiseHandler_1.QuantumNoiseHandler();
        this.entanglementManager = new entanglementManager_1.QuantumEntanglementManager();
        this.metrics = {
            circuitDepth: 0,
            entanglementEntropy: 0,
            noiseLevel: 0,
            optimizationScore: 0,
            featureQuality: 0,
            statePurity: 0
        };
    }
    async initialize() {
        logger_1.logger.info('Initializing Quantum Processor with advanced features...');
        await Promise.all([
            this.circuit.initialize(),
            this.optimizer.initialize(),
            this.featureExtractor.initialize(),
            this.stateManager.initialize(),
            this.noiseHandler.initialize(),
            this.entanglementManager.initialize()
        ]);
        logger_1.logger.info('✅ Quantum Processor initialized successfully');
    }
    async enhanceInput(input) {
        try {
            // Convert input to quantum state
            const quantumState = await this.stateManager.toQuantumState(input);
            // Apply quantum feature extraction
            const quantumFeatures = await this.featureExtractor.extract(quantumState);
            // Apply quantum optimization
            const optimizedState = await this.optimizer.optimize(quantumFeatures);
            // Apply noise adjustment
            const noiseAdjustedState = await this.noiseHandler.adjust(optimizedState);
            // Apply quantum entanglement
            const entangledState = await this.entanglementManager.entangle(noiseAdjustedState);
            // Convert back to classical state
            const enhancedInput = await this.stateManager.toClassicalState(entangledState);
            // Update metrics
            this.updateMetrics();
            return enhancedInput;
        }
        catch (error) {
            logger_1.logger.error('❌ Quantum enhancement failed:', error);
            throw error;
        }
    }
    async optimizeDecision(decision) {
        try {
            // Convert decision to quantum state
            const quantumState = await this.stateManager.toQuantumState(decision);
            // Apply quantum optimization
            const optimizedState = await this.optimizer.optimize(quantumState);
            // Apply quantum entanglement
            const entangledState = await this.entanglementManager.entangle(optimizedState);
            // Convert back to classical state
            const optimizedDecision = await this.stateManager.toClassicalState(entangledState);
            return optimizedDecision;
        }
        catch (error) {
            logger_1.logger.error('❌ Quantum decision optimization failed:', error);
            throw error;
        }
    }
    async optimizePredictions(predictions) {
        try {
            const optimizedPredictions = await Promise.all(predictions.map(async (pred) => {
                const quantumState = await this.stateManager.toQuantumState(pred);
                const optimizedState = await this.optimizer.optimize(quantumState);
                return await this.stateManager.toClassicalState(optimizedState);
            }));
            return optimizedPredictions;
        }
        catch (error) {
            logger_1.logger.error('❌ Quantum prediction optimization failed:', error);
            throw error;
        }
    }
    async enhance(model) {
        try {
            // Apply quantum enhancements to model weights
            const weights = model.getWeights();
            const enhancedWeights = await Promise.all(weights.map(async (weight) => {
                const quantumState = await this.stateManager.toQuantumState(weight);
                const optimizedState = await this.optimizer.optimize(quantumState);
                return await this.stateManager.toClassicalState(optimizedState);
            }));
            model.setWeights(enhancedWeights);
            return model;
        }
        catch (error) {
            logger_1.logger.error('❌ Quantum model enhancement failed:', error);
            throw error;
        }
    }
    updateMetrics() {
        this.metrics = {
            circuitDepth: this.circuit.getDepth(),
            entanglementEntropy: this.entanglementManager.getEntropy(),
            noiseLevel: this.noiseHandler.getNoiseLevel(),
            optimizationScore: this.optimizer.getScore(),
            featureQuality: this.featureExtractor.getQuality(),
            statePurity: this.stateManager.getPurity()
        };
    }
    getMetrics() {
        return this.metrics;
    }
    async dispose() {
        await Promise.all([
            this.circuit.dispose(),
            this.optimizer.dispose(),
            this.featureExtractor.dispose(),
            this.stateManager.dispose(),
            this.noiseHandler.dispose(),
            this.entanglementManager.dispose()
        ]);
    }
}
exports.QuantumProcessor = QuantumProcessor;
//# sourceMappingURL=quantumProcessor.js.map