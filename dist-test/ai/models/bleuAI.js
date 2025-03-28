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
exports.BleuAI = void 0;
const tf = __importStar(require("@tensorflow/tfjs-node"));
const logger_1 = require("../../utils/logger");
const tokenizer_1 = require("../utils/tokenizer");
class BleuAI {
    constructor(config) {
        this.model = null;
        this.tokenizer = null;
        this.config = config;
    }
    async initialize() {
        try {
            // Load tokenizer
            this.tokenizer = await (0, tokenizer_1.loadTokenizer)(this.config.modelPath + '/tokenizer.json');
            // Load or create model
            try {
                this.model = await tf.loadLayersModel(`file://${this.config.modelPath}/model.json`);
                logger_1.logger.info('Model loaded successfully');
            }
            catch (error) {
                logger_1.logger.warn('Could not load existing model, creating new one', { error });
                this.model = this.createModel();
                await this.model.save(`file://${this.config.modelPath}`);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize BleuAI', { error });
            throw new Error('Failed to initialize BleuAI');
        }
    }
    createModel() {
        const model = tf.sequential();
        // Add layers based on configuration
        this.config.architecture.layers.forEach((units, index) => {
            if (index === 0) {
                model.add(tf.layers.dense({
                    units,
                    inputShape: [this.tokenizer.vocabSize],
                    activation: 'relu'
                }));
            }
            else {
                model.add(tf.layers.dense({ units, activation: 'relu' }));
            }
        });
        // Add output layer
        model.add(tf.layers.dense({
            units: this.tokenizer.vocabSize,
            activation: 'softmax'
        }));
        // Compile model
        model.compile({
            optimizer: tf.train.adam(this.config.training.learningRate),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });
        return model;
    }
    async process(text) {
        if (!this.model || !this.tokenizer) {
            throw new Error('Model not initialized');
        }
        try {
            // Encode input text
            const tokens = await this.tokenizer.encode(text);
            // Convert to tensor and make prediction
            const inputTensor = tf.tensor2d([tokens], [1, tokens.length]);
            const prediction = this.model.predict(inputTensor);
            // Get the predicted tokens
            const predictedTokens = await prediction.argMax(-1).array();
            // Decode back to text
            const result = await this.tokenizer.decode(predictedTokens);
            // Cleanup
            inputTensor.dispose();
            prediction.dispose();
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error processing text', { error, text });
            throw new Error('Failed to process text');
        }
    }
    async analyzeCode(code) {
        if (!this.model || !this.tokenizer) {
            throw new Error('Model not initialized');
        }
        try {
            // Encode input code
            const tokens = await this.tokenizer.encode(code);
            // Convert to tensor and make prediction
            const inputTensor = tf.tensor2d([tokens], [1, tokens.length]);
            const prediction = this.model.predict(inputTensor);
            // Convert prediction to structured analysis
            const analysis = await this.parseCodeAnalysis(await prediction.data());
            // Cleanup
            inputTensor.dispose();
            prediction.dispose();
            return analysis;
        }
        catch (error) {
            logger_1.logger.error('Error analyzing code', { error, code });
            throw new Error('Failed to analyze code');
        }
    }
    async parseCodeAnalysis(prediction) {
        // Implement your logic to convert model predictions into structured analysis
        // This is a placeholder implementation
        return {
            complexity: prediction[0],
            quality: prediction[1],
            maintainability: prediction[2],
            suggestions: []
        };
    }
    async dispose() {
        try {
            if (this.model) {
                this.model.dispose();
                this.model = null;
            }
            this.tokenizer = null;
        }
        catch (error) {
            logger_1.logger.error('Error disposing model', { error });
            throw new Error('Failed to dispose model');
        }
    }
}
exports.BleuAI = BleuAI;
//# sourceMappingURL=bleuAI.js.map