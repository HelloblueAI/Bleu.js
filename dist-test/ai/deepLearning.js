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
exports.DeepLearningModel = void 0;
const tf = __importStar(require("@tensorflow/tfjs"));
const logger_1 = require("../utils/logger");
class DeepLearningModel {
    constructor(config = {}) {
        this.model = null;
        this.logger = (0, logger_1.createLogger)('DeepLearning');
        this.isCompiled = false;
        this.isTrained = false;
        this.config = {
            modelPath: config.modelPath || './models/model.json',
            inputShape: config.inputShape || [10],
            outputShape: config.outputShape || [2],
            layers: config.layers || [
                { units: 64, activation: 'relu' },
                { units: 32, activation: 'relu' }
            ],
            batchSize: config.batchSize || 32,
            epochs: config.epochs || 10,
            learningRate: config.learningRate || 0.001,
            validationSplit: config.validationSplit || 0.2,
            earlyStopping: config.earlyStopping || false,
            modelCheckpoint: config.modelCheckpoint || false,
            dropout: config.dropout || 0.2,
            regularization: config.regularization || 0.01,
            architecture: {
                type: config.architecture?.type || 'sequential',
                layers: config.architecture?.layers || [64, 32, 16],
                activation: config.architecture?.activation || 'relu',
                inputShape: config.architecture?.inputShape || [10]
            },
            training: {
                optimizer: config.training?.optimizer || 'adam',
                loss: config.training?.loss || 'meanSquaredError',
                metrics: config.training?.metrics || ['accuracy'],
                epochs: config.training?.epochs || 10,
                batchSize: config.training?.batchSize || 32,
                validationSplit: config.training?.validationSplit || 0.2
            }
        };
    }
    getConfig() {
        return this.config;
    }
    isModelCompiled() {
        return this.isCompiled;
    }
    isModelTrained() {
        return this.isTrained;
    }
    getModel() {
        return this.model;
    }
    async initialize() {
        try {
            this.model = await tf.loadLayersModel(`file://${this.config.modelPath}`);
            this.logger.info('Model loaded successfully');
            this.isCompiled = true;
            this.isTrained = true;
        }
        catch (error) {
            this.logger.info('Creating new model');
            this.model = this.createModel();
            await this.model.save(`file://${this.config.modelPath}`);
        }
    }
    createModel() {
        let model;
        if (this.config.architecture.type === 'sequential') {
            model = tf.sequential();
            // Add input layer
            model.add(tf.layers.dense({
                units: this.config.layers[0].units,
                activation: this.config.layers[0].activation,
                inputShape: this.config.inputShape,
                kernelRegularizer: tf.regularizers.l2({ l2: this.config.regularization })
            }));
            // Add hidden layers
            for (let i = 1; i < this.config.layers.length; i++) {
                model.add(tf.layers.dense({
                    units: this.config.layers[i].units,
                    activation: this.config.layers[i].activation,
                    kernelRegularizer: tf.regularizers.l2({ l2: this.config.regularization })
                }));
                if (this.config.dropout > 0) {
                    model.add(tf.layers.dropout({ rate: this.config.dropout }));
                }
            }
        }
        else {
            // Functional API implementation
            const input = tf.input({ shape: this.config.inputShape });
            let x = input;
            // Add hidden layers
            for (let i = 0; i < this.config.layers.length; i++) {
                x = tf.layers.dense({
                    units: this.config.layers[i].units,
                    activation: this.config.layers[i].activation,
                    kernelRegularizer: tf.regularizers.l2({ l2: this.config.regularization })
                }).apply(x);
                if (this.config.dropout > 0) {
                    x = tf.layers.dropout({ rate: this.config.dropout }).apply(x);
                }
            }
            model = tf.model({ inputs: input, outputs: x });
        }
        return model;
    }
    async compile() {
        if (!this.model) {
            this.model = this.createModel();
        }
        // Configure optimizer
        let optimizer;
        switch (this.config.training.optimizer) {
            case 'adam':
                optimizer = tf.train.adam(this.config.learningRate);
                break;
            case 'sgd':
                optimizer = tf.train.sgd(this.config.learningRate);
                break;
            case 'rmsprop':
                optimizer = tf.train.rmsprop(this.config.learningRate);
                break;
            default:
                optimizer = tf.train.adam(this.config.learningRate);
        }
        // Compile model
        this.model.compile({
            optimizer,
            loss: this.config.training.loss,
            metrics: this.config.training.metrics
        });
        this.isCompiled = true;
    }
    async train(x, y, validationData) {
        if (!this.model) {
            throw new Error('Model not initialized. Call initialize() first.');
        }
        if (!this.isCompiled) {
            throw new Error('Model must be compiled before training');
        }
        const callbacks = [];
        if (this.config.earlyStopping) {
            callbacks.push(tf.callbacks.earlyStopping({
                monitor: 'val_loss',
                patience: 5
            }));
        }
        if (this.config.modelCheckpoint) {
            callbacks.push(tf.callbacks.modelCheckpoint({
                filepath: `${this.config.modelPath}/checkpoint`,
                saveBestOnly: true,
                monitor: 'val_loss'
            }));
        }
        callbacks.push({
            onEpochEnd: (epoch, logs) => {
                this.logger.info(`Epoch ${epoch + 1}: loss = ${logs?.loss.toFixed(4)}, accuracy = ${logs?.acc?.toFixed(4) || 'N/A'}`);
            }
        });
        const history = await this.model.fit(x, y, {
            epochs: this.config.epochs,
            batchSize: this.config.batchSize,
            validationSplit: this.config.validationSplit,
            validationData,
            callbacks
        });
        this.isTrained = true;
        return history;
    }
    async predict(x) {
        if (!this.model) {
            throw new Error('Model not initialized. Call initialize() first.');
        }
        if (!this.isTrained) {
            throw new Error('Model must be trained before prediction');
        }
        return this.model.predict(x);
    }
    async evaluate(x, y) {
        if (!this.model) {
            throw new Error('Model not initialized. Call initialize() first.');
        }
        if (!this.isTrained) {
            throw new Error('Model must be trained before evaluation');
        }
        const result = await this.model.evaluate(x, y);
        return Promise.all(result.map(r => r.data())).then(arrays => arrays.map(arr => arr[0]));
    }
    async saveModel(path) {
        if (!this.model) {
            throw new Error('Model not initialized. Call initialize() first.');
        }
        await this.model.save(`file://${path}`);
    }
    dispose() {
        if (this.model) {
            this.model.dispose();
            this.model = null;
        }
    }
    static async load(path) {
        const model = new DeepLearningModel({
            modelPath: path
        });
        await model.initialize();
        return model;
    }
}
exports.DeepLearningModel = DeepLearningModel;
exports.default = DeepLearningModel;
//# sourceMappingURL=deepLearning.js.map