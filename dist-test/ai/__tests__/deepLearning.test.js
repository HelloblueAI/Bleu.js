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
const deepLearning_1 = require("../deepLearning");
const tf = __importStar(require("@tensorflow/tfjs-node"));
describe('DeepLearningModel', () => {
    let model;
    let testData;
    beforeEach(async () => {
        // Create real test data
        const numSamples = 100;
        const inputDim = 10;
        const outputDim = 2;
        // Generate random input data
        testData = {
            x: tf.randomNormal([numSamples, inputDim]),
            y: tf.randomUniform([numSamples, outputDim]),
            validationX: tf.randomNormal([20, inputDim]),
            validationY: tf.randomUniform([20, outputDim])
        };
        // Initialize model with test configuration
        model = new deepLearning_1.DeepLearningModel({
            inputShape: [inputDim],
            outputShape: [outputDim],
            layers: [
                { units: 64, activation: 'relu' },
                { units: 32, activation: 'relu' }
            ],
            batchSize: 32,
            epochs: 2,
            learningRate: 0.001,
            validationSplit: 0.2,
            earlyStopping: true,
            modelCheckpoint: true,
            dropout: 0.2,
            regularization: 0.01
        });
    });
    afterEach(async () => {
        if (model) {
            await model.dispose();
        }
        // Clean up tensors
        if (testData) {
            Object.values(testData).forEach(tensor => tensor.dispose());
        }
    });
    describe('initialization', () => {
        it('should initialize with default configuration', () => {
            const defaultModel = new deepLearning_1.DeepLearningModel();
            expect(defaultModel.getConfig()).toBeDefined();
            expect(defaultModel.isModelCompiled()).toBe(false);
            expect(defaultModel.isModelTrained()).toBe(false);
            defaultModel.dispose();
        });
        it('should initialize with custom configuration', () => {
            expect(model.getConfig().inputShape).toEqual([10]);
            expect(model.getConfig().outputShape).toEqual([2]);
            expect(model.getConfig().layers).toHaveLength(2);
            expect(model.getConfig().dropout).toBe(0.2);
        });
    });
    describe('model compilation', () => {
        it('should compile model successfully', async () => {
            await model.compile();
            expect(model.isModelCompiled()).toBe(true);
        });
        it('should not compile model twice', async () => {
            await model.compile();
            await model.compile();
            expect(model.isModelCompiled()).toBe(true);
        });
    });
    describe('model training', () => {
        beforeEach(async () => {
            await model.compile();
        });
        it('should train model successfully', async () => {
            const history = await model.train(testData.x, testData.y);
            expect(history).toBeDefined();
            expect(model.isModelTrained()).toBe(true);
            expect(history.history.loss).toBeDefined();
            expect(history.history.accuracy).toBeDefined();
        });
        it('should train with validation data', async () => {
            const history = await model.train(testData.x, testData.y, [testData.validationX, testData.validationY]);
            expect(history.history.val_loss).toBeDefined();
            expect(history.history.val_accuracy).toBeDefined();
        });
        it('should throw error if model is not compiled', async () => {
            const uncompiledModel = new deepLearning_1.DeepLearningModel({
                inputShape: [10],
                outputShape: [2]
            });
            await expect(uncompiledModel.train(testData.x, testData.y)).rejects.toThrow('Model must be compiled before training');
            await uncompiledModel.dispose();
        });
    });
    describe('model prediction', () => {
        beforeEach(async () => {
            await model.compile();
            await model.train(testData.x, testData.y);
        });
        it('should make predictions successfully', async () => {
            const predictions = await model.predict(testData.x);
            expect(predictions).toBeDefined();
            expect(predictions.shape[0]).toBe(testData.x.shape[0]);
            expect(predictions.shape[1]).toBe(testData.y.shape[1]);
            predictions.dispose();
        });
        it('should throw error if model is not trained', async () => {
            const untrainedModel = new deepLearning_1.DeepLearningModel({
                inputShape: [10],
                outputShape: [2]
            });
            await untrainedModel.compile();
            await expect(untrainedModel.predict(testData.x)).rejects.toThrow('Model must be trained before prediction');
            await untrainedModel.dispose();
        });
    });
    describe('model evaluation', () => {
        beforeEach(async () => {
            await model.compile();
            await model.train(testData.x, testData.y);
        });
        it('should evaluate model successfully', async () => {
            const metrics = await model.evaluate(testData.x, testData.y);
            expect(metrics).toBeDefined();
            expect(Array.isArray(metrics)).toBe(true);
            expect(metrics.length).toBeGreaterThan(0);
        });
        it('should throw error if model is not trained', async () => {
            const untrainedModel = new deepLearning_1.DeepLearningModel({
                inputShape: [10],
                outputShape: [2]
            });
            await untrainedModel.compile();
            await expect(untrainedModel.evaluate(testData.x, testData.y)).rejects.toThrow('Model must be trained before evaluation');
            await untrainedModel.dispose();
        });
    });
    describe('model persistence', () => {
        beforeEach(async () => {
            await model.compile();
            await model.train(testData.x, testData.y);
        });
        it('should save and load model successfully', async () => {
            const savePath = './models/test-model';
            await model.saveModel(savePath);
            const loadedModel = await deepLearning_1.DeepLearningModel.load(savePath);
            expect(loadedModel.isModelCompiled()).toBe(true);
            expect(loadedModel.isModelTrained()).toBe(true);
            const predictions = await loadedModel.predict(testData.x);
            expect(predictions).toBeDefined();
            expect(predictions.shape[0]).toBe(testData.x.shape[0]);
            expect(predictions.shape[1]).toBe(testData.y.shape[1]);
            predictions.dispose();
            await loadedModel.dispose();
        });
    });
});
//# sourceMappingURL=deepLearning.test.js.map