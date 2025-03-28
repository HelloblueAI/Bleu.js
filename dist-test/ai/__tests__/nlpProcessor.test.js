"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nlpProcessor_1 = require("../nlpProcessor");
const bleuAI_1 = require("../models/bleuAI");
describe('NLPProcessor', () => {
    let nlpProcessor;
    let bleuAI;
    let testData;
    beforeEach(async () => {
        // Initialize BleuAI
        bleuAI = new bleuAI_1.BleuAI({
            modelPath: './models/bleu',
            architecture: {
                type: 'transformer',
                layers: [512, 256, 128],
                attentionHeads: 8,
                hiddenSize: 512,
                maxSequenceLength: 1024
            },
            training: {
                epochs: 10,
                batchSize: 32,
                learningRate: 0.001
            }
        });
        nlpProcessor = new nlpProcessor_1.NLPProcessor({
            modelPath: './models/test-nlp-model',
            maxSequenceLength: 100,
            vocabularySize: 10000,
            embeddingDim: 100,
            numLayers: 2,
            hiddenUnits: 128,
            dropoutRate: 0.2,
        });
        // Create real test data
        testData = {
            texts: [
                'This is a positive review about the product.',
                'I really enjoyed using this service.',
                'The quality is excellent and the price is reasonable.',
                'I would highly recommend this to others.',
                'This is a negative review about the product.',
                'I was disappointed with the service.',
                'The quality is poor and the price is too high.',
                'I would not recommend this to others.'
            ],
            labels: [1, 1, 1, 1, 0, 0, 0, 0]
        };
    });
    afterEach(async () => {
        await nlpProcessor.dispose();
        await bleuAI.dispose();
    });
    describe('initialize', () => {
        it('should initialize the model', async () => {
            await Promise.all([
                bleuAI.initialize(),
                nlpProcessor.initialize()
            ]);
            // The models should be initialized successfully
            expect(true).toBe(true);
        });
    });
    describe('processText', () => {
        beforeEach(async () => {
            await Promise.all([
                bleuAI.initialize(),
                nlpProcessor.initialize()
            ]);
        });
        it('should process text and return prediction', async () => {
            const result = await nlpProcessor.processText(testData.texts[0]);
            expect(typeof result).toBe('number');
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThanOrEqual(1);
        });
        it('should throw error if model not initialized', async () => {
            const uninitializedProcessor = new nlpProcessor_1.NLPProcessor({
                modelPath: './models/test-nlp-model',
                maxSequenceLength: 100,
                vocabularySize: 10000,
                embeddingDim: 100,
                numLayers: 2,
                hiddenUnits: 128,
                dropoutRate: 0.2,
            });
            await expect(uninitializedProcessor.processText('test text'))
                .rejects.toThrow('Model or tokenizer not initialized');
            await uninitializedProcessor.dispose();
        });
    });
    describe('analyzeText', () => {
        beforeEach(async () => {
            await Promise.all([
                bleuAI.initialize(),
                nlpProcessor.initialize()
            ]);
        });
        it('should analyze text and return sentiment', async () => {
            const result = await nlpProcessor.analyzeText(testData.texts[0]);
            expect(result).toHaveProperty('sentiment');
            expect(result).toHaveProperty('entities');
            expect(result).toHaveProperty('keywords');
            expect(typeof result.sentiment).toBe('number');
            expect(Array.isArray(result.entities)).toBe(true);
            expect(Array.isArray(result.keywords)).toBe(true);
        });
        it('should use BleuAI for advanced analysis', async () => {
            const text = testData.texts[0];
            const [nlpResult, bleuResult] = await Promise.all([
                nlpProcessor.analyzeText(text),
                bleuAI.process(text)
            ]);
            expect(nlpResult).toBeDefined();
            expect(bleuResult).toBeDefined();
            expect(typeof bleuResult).toBe('string');
        });
    });
    describe('train', () => {
        beforeEach(async () => {
            await Promise.all([
                bleuAI.initialize(),
                nlpProcessor.initialize()
            ]);
        });
        it('should train model with provided data', async () => {
            const result = await nlpProcessor.train(testData.texts, testData.labels);
            expect(result).toHaveProperty('history');
            expect(result.history).toHaveProperty('loss');
            expect(result.history).toHaveProperty('accuracy');
            expect(Array.isArray(result.history.loss)).toBe(true);
            expect(Array.isArray(result.history.accuracy)).toBe(true);
        });
    });
    describe('evaluate', () => {
        beforeEach(async () => {
            await Promise.all([
                bleuAI.initialize(),
                nlpProcessor.initialize()
            ]);
            await nlpProcessor.train(testData.texts, testData.labels);
        });
        it('should evaluate model with provided data', async () => {
            const result = await nlpProcessor.evaluate(testData.texts, testData.labels);
            expect(result).toHaveProperty('loss');
            expect(result).toHaveProperty('accuracy');
            expect(typeof result.loss).toBe('number');
            expect(typeof result.accuracy).toBe('number');
        });
    });
    describe('dispose', () => {
        it('should dispose of model resources', async () => {
            await Promise.all([
                bleuAI.initialize(),
                nlpProcessor.initialize()
            ]);
            await Promise.all([
                bleuAI.dispose(),
                nlpProcessor.dispose()
            ]);
            // The models should be disposed successfully
            expect(true).toBe(true);
        });
    });
});
//# sourceMappingURL=nlpProcessor.test.js.map