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
const logger_1 = require("../utils/logger");
const bleuAI_1 = require("../models/bleuAI");
const sentimentAnalyzer_1 = require("../analyzers/sentimentAnalyzer");
const entityRecognizer_1 = require("../recognizers/entityRecognizer");
const topicModeler_1 = require("../models/topicModeler");
const textSummarizer_1 = require("../summarizers/textSummarizer");
const questionAnswerer_1 = require("../questionAnswerers/questionAnswerer");
class NLPProcessor {
    constructor(config) {
        this.model = null;
        this.tokenizer = null;
        this.logger = (0, logger_1.createLogger)('NLPProcessor');
        this.config = config;
        this.sentimentAnalyzer = new sentimentAnalyzer_1.SentimentAnalyzer();
        this.entityRecognizer = new entityRecognizer_1.EntityRecognizer();
        this.topicModeler = new topicModeler_1.TopicModeler();
        this.summarizer = new textSummarizer_1.TextSummarizer();
        this.questionAnswerer = new questionAnswerer_1.QuestionAnswerer();
    }
    async initialize() {
        logger.info('Initializing NLP Processor with advanced capabilities...');
        // Initialize tokenizer with advanced vocabulary
        this.tokenizer = await this.initializeTokenizer();
        // Initialize main model
        this.model = this.createModel();
        // Initialize specialized components
        await this.sentimentAnalyzer.initialize();
        await this.entityRecognizer.initialize();
        await this.topicModeler.initialize();
        await this.summarizer.initialize();
        await this.questionAnswerer.initialize();
        logger.info('NLP Processor initialized successfully');
    }
    async initializeTokenizer() {
        // Initialize with advanced vocabulary and tokenization rules
        return new bleuAI_1.Tokenizer({
            vocabularySize: this.config.vocabularySize,
            maxSequenceLength: this.config.maxSequenceLength,
            specialTokens: ['<PAD>', '<UNK>', '<CLS>', '<SEP>', '<MASK>'],
            tokenizationRules: {
                caseSensitive: true,
                handlePunctuation: true,
                handleNumbers: true,
                handleEmojis: true
            }
        });
    }
    createModel() {
        const model = tf.sequential();
        // Embedding layer with positional encoding
        model.add(tf.layers.embedding({
            inputDim: this.config.vocabularySize,
            outputDim: this.config.embeddingDim,
            inputLength: this.config.maxSequenceLength
        }));
        model.add(tf.layers.positionalEncoding({
            maxLen: this.config.maxSequenceLength,
            dModel: this.config.embeddingDim
        }));
        // Transformer blocks
        for (let i = 0; i < this.config.numTransformerBlocks; i++) {
            model.add(tf.layers.transformerBlock({
                numHeads: this.config.numHeads,
                keyDim: this.config.keyDim,
                ffDim: this.config.ffDim,
                dropout: this.config.dropoutRate
            }));
        }
        // Task-specific output layers
        model.add(tf.layers.dense({
            units: this.config.numClasses,
            activation: 'softmax'
        }));
        model.compile({
            optimizer: tf.train.adam(this.config.learningRate),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy', 'precision', 'recall', 'f1Score']
        });
        return model;
    }
    async process(text) {
        try {
            // Tokenize and convert to tensor
            const tokens = await this.tokenize(text);
            const inputTensor = await this.convertToTensor(tokens);
            // Extract features using intermediate layer
            const features = await this.extractIntermediateFeatures(inputTensor);
            // Perform advanced NLP tasks in parallel
            const [sentiment, entities, topics, summary, qaResults] = await Promise.all([
                this.sentimentAnalyzer.analyze(text),
                this.entityRecognizer.recognize(text),
                this.topicModeler.model(text),
                this.summarizer.summarize(text),
                this.questionAnswerer.answer(text)
            ]);
            return {
                features,
                sentiment,
                entities,
                topics,
                summary,
                qaResults,
                metadata: {
                    tokenCount: tokens.length,
                    processingTime: Date.now(),
                    modelVersion: this.config.modelVersion
                }
            };
        }
        catch (error) {
            logger.error('Error processing text:', error);
            throw error;
        }
    }
    async tokenize(text) {
        if (!this.tokenizer) {
            throw new Error('Tokenizer not initialized');
        }
        return this.tokenizer.tokenize(text);
    }
    async convertToTensor(tokens) {
        return tf.tensor2d([tokens]);
    }
    async extractIntermediateFeatures(tensor) {
        const intermediateLayer = this.model.getLayer('intermediate');
        const features = await intermediateLayer.predict(tensor);
        return Array.from(await features.data());
    }
    async processText(text) {
        if (!this.model || !this.tokenizer) {
            throw new Error('Model or tokenizer not initialized');
        }
        const tokens = this.tokenizer.encode(text);
        const paddedTokens = this.padSequence(tokens, this.config.maxSequenceLength);
        const input = tf.tensor2d([paddedTokens], [1, this.config.maxSequenceLength]);
        const prediction = this.model.predict(input);
        const result = await prediction.data();
        // Cleanup
        input.dispose();
        prediction.dispose();
        return result[0];
    }
    async analyzeText(text) {
        const sentiment = await this.processText(text);
        // Simple entity extraction (looking for capitalized words)
        const words = text.split(/\s+/);
        const entities = words
            .filter(token => /^[A-Z]/.test(token))
            .map(token => token.replace(/[.,!?]$/, ''));
        // Simple keyword extraction (non-stopwords)
        const stopwords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
        const keywords = words
            .filter(word => !stopwords.has(word.toLowerCase()))
            .map(word => word.toLowerCase())
            .slice(0, 10);
        return {
            sentiment,
            entities: Array.from(new Set(entities)),
            keywords: Array.from(new Set(keywords))
        };
    }
    padSequence(sequence, maxLength) {
        if (sequence.length > maxLength) {
            return sequence.slice(0, maxLength);
        }
        return [...sequence, ...new Array(maxLength - sequence.length).fill(0)];
    }
    async train(texts, labels) {
        if (!this.model || !this.tokenizer) {
            throw new Error('Model or tokenizer not initialized');
        }
        const sequences = texts.map(text => {
            const tokens = this.tokenizer.encode(text);
            return this.padSequence(tokens, this.config.maxSequenceLength);
        });
        const xs = tf.tensor2d(sequences, [sequences.length, this.config.maxSequenceLength]);
        const ys = tf.tensor2d(labels, [labels.length, 1]);
        const history = await this.model.fit(xs, ys, {
            epochs: 10,
            batchSize: 32,
            validationSplit: 0.2,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    this.logger.info(`Epoch ${epoch + 1}: loss = ${logs?.loss.toFixed(4)}, accuracy = ${logs?.acc.toFixed(4)}`);
                }
            }
        });
        // Cleanup
        xs.dispose();
        ys.dispose();
        return history;
    }
    async evaluate(texts, labels) {
        if (!this.model || !this.tokenizer) {
            throw new Error('Model or tokenizer not initialized');
        }
        const sequences = texts.map(text => {
            const tokens = this.tokenizer.encode(text);
            return this.padSequence(tokens, this.config.maxSequenceLength);
        });
        const xs = tf.tensor2d(sequences, [sequences.length, this.config.maxSequenceLength]);
        const ys = tf.tensor2d(labels, [labels.length, 1]);
        const result = await this.model.evaluate(xs, ys);
        const [loss, accuracy] = await Promise.all(result.map(r => r.data()));
        // Cleanup
        xs.dispose();
        ys.dispose();
        result.forEach(r => r.dispose());
        return {
            loss: loss[0],
            accuracy: accuracy[0]
        };
    }
    dispose() {
        if (this.model) {
            this.model.dispose();
            this.model = null;
        }
    }
}
exports.NLPProcessor = NLPProcessor;
exports.default = NLPProcessor;
//# sourceMappingURL=nlpProcessor.js.map