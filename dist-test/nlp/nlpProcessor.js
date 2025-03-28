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
exports.NLPProcessor = void 0;
const tf = __importStar(require("@tensorflow/tfjs"));
const inference_1 = require("@huggingface/inference");
const logger_1 = require("../utils/logger");
const sentimentAnalyzer_1 = require("./analyzers/sentimentAnalyzer");
const entityRecognizer_1 = require("./analyzers/entityRecognizer");
const topicModeler_1 = require("./analyzers/topicModeler");
const textSummarizer_1 = require("./analyzers/textSummarizer");
const questionAnswerer_1 = require("./analyzers/questionAnswerer");
class NLPProcessor {
    constructor(config) {
        this.model = null;
        this.config = config;
        this.hf = new inference_1.HfInference(process.env.HUGGINGFACE_TOKEN);
        this.sentimentAnalyzer = new sentimentAnalyzer_1.SentimentAnalyzer();
        this.entityRecognizer = new entityRecognizer_1.EntityRecognizer();
        this.topicModeler = new topicModeler_1.TopicModeler();
        this.textSummarizer = new textSummarizer_1.TextSummarizer();
        this.questionAnswerer = new questionAnswerer_1.QuestionAnswerer();
    }
    async initialize() {
        logger_1.logger.info('Initializing NLP Processor with advanced capabilities...');
        try {
            // Initialize tokenizer
            this.tokenizer = await this.loadTokenizer();
            // Initialize model
            this.model = await this.createModel();
            // Initialize specialized components
            await Promise.all([
                this.sentimentAnalyzer.initialize(),
                this.entityRecognizer.initialize(),
                this.topicModeler.initialize(),
                this.textSummarizer.initialize(),
                this.questionAnswerer.initialize()
            ]);
            logger_1.logger.info('✅ NLP Processor initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to initialize NLP Processor:', error);
            throw error;
        }
    }
    async loadTokenizer() {
        // Load tokenizer from HuggingFace
        return await this.hf.loadTokenizer(this.config.modelVersion);
    }
    async createModel() {
        const model = tf.sequential();
        // Add embedding layer with positional encoding
        model.add(tf.layers.embedding({
            inputDim: this.tokenizer.vocabSize,
            outputDim: this.config.keyDim,
            inputLength: this.config.maxSequenceLength
        }));
        // Add positional encoding
        model.add(tf.layers.positionalEncoding({
            maxLen: this.config.maxSequenceLength,
            dModel: this.config.keyDim
        }));
        // Add transformer blocks
        for (let i = 0; i < this.config.numTransformerBlocks; i++) {
            model.add(tf.layers.transformerEncoder({
                numHeads: this.config.numHeads,
                keyDim: this.config.keyDim,
                ffDim: this.config.ffDim,
                dropout: 0.1
            }));
        }
        // Add output layers
        model.add(tf.layers.dense({
            units: this.config.keyDim,
            activation: 'relu'
        }));
        model.add(tf.layers.dropout({ rate: 0.1 }));
        model.add(tf.layers.dense({
            units: this.tokenizer.vocabSize,
            activation: 'softmax'
        }));
        // Compile model with advanced metrics
        model.compile({
            optimizer: tf.train.adam(this.config.learningRate),
            loss: 'categoricalCrossentropy',
            metrics: [
                'accuracy',
                tf.metrics.precision(),
                tf.metrics.recall(),
                tf.metrics.f1Score()
            ]
        });
        return model;
    }
    async process(text) {
        try {
            // Tokenize input
            const tokens = await this.tokenizer.encode(text);
            // Convert to tensor
            const inputTensor = tf.tensor2d([tokens], [1, tokens.length]);
            // Run parallel NLP tasks
            const [sentiment, entities, topics, summary, qa] = await Promise.all([
                this.sentimentAnalyzer.analyze(text),
                this.entityRecognizer.recognize(text),
                this.topicModeler.model(text),
                this.textSummarizer.summarize(text),
                this.questionAnswerer.answer(text)
            ]);
            // Get model predictions
            const predictions = await this.model.predict(inputTensor);
            // Cleanup
            inputTensor.dispose();
            predictions.dispose();
            return {
                sentiment,
                entities,
                topics,
                summary,
                qa,
                predictions: await predictions.array()
            };
        }
        catch (error) {
            logger_1.logger.error('❌ NLP processing failed:', error);
            throw error;
        }
    }
    async tokenize(text) {
        return await this.tokenizer.encode(text);
    }
    async tensorize(tokens) {
        return tf.tensor2d([tokens], [1, tokens.length]);
    }
    async extractFeatures(tensor) {
        // Extract features using the model's intermediate layers
        const intermediateModel = tf.model({
            inputs: this.model.inputs,
            outputs: this.model.layers[this.config.numTransformerBlocks - 1].output
        });
        return await intermediateModel.predict(tensor);
    }
    async dispose() {
        if (this.model) {
            this.model.dispose();
            this.model = null;
        }
        this.tokenizer = null;
        await Promise.all([
            this.sentimentAnalyzer.dispose(),
            this.entityRecognizer.dispose(),
            this.topicModeler.dispose(),
            this.textSummarizer.dispose(),
            this.questionAnswerer.dispose()
        ]);
    }
}
exports.NLPProcessor = NLPProcessor;
//# sourceMappingURL=nlpProcessor.js.map