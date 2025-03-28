"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiModalProcessor = void 0;
const logger_1 = require("../../utils/logger");
const image_1 = require("./processors/image");
const audio_1 = require("./processors/audio");
const video_1 = require("./processors/video");
const text_1 = require("./processors/text");
const code_1 = require("./processors/code");
const crossModalFusion_1 = require("./fusion/crossModalFusion");
const advancedFeatureExtractor_1 = require("./featureExtraction/advancedFeatureExtractor");
const crossModalAttention_1 = require("./attention/crossModalAttention");
const quantumEnhancer_1 = require("./enhancers/quantumEnhancer");
const securityManager_1 = require("./managers/securityManager");
const performanceOptimizer_1 = require("./optimizers/performanceOptimizer");
const advancedVisualizer_1 = require("./visualizers/advancedVisualizer");
const enterpriseMetrics_1 = require("./metrics/enterpriseMetrics");
const distributedProcessor_1 = require("./processors/distributedProcessor");
class MultiModalProcessor {
    constructor(config) {
        this.config = config;
        this.quantumEnhancer = new quantumEnhancer_1.QuantumEnhancer();
        this.securityManager = new securityManager_1.SecurityManager();
        this.performanceOptimizer = new performanceOptimizer_1.PerformanceOptimizer();
        this.advancedVisualizer = new advancedVisualizer_1.AdvancedVisualizer();
        this.enterpriseMetrics = new enterpriseMetrics_1.EnterpriseMetrics();
        this.distributedProcessor = new distributedProcessor_1.DistributedProcessor();
        // Initialize processors with our own models
        const baseConfig = {
            modelPath: config.models.text,
            modelVersion: config.modelVersion,
            modelType: config.modelType,
            optimizationLevel: config.optimizationLevel,
            company: config.company
        };
        this.textProcessor = new text_1.TextProcessor({
            ...baseConfig,
            modelPath: config.models.text,
            maxSequenceLength: 512,
            vocabularySize: 50000
        });
        this.codeProcessor = new code_1.CodeProcessor({
            ...baseConfig,
            modelPath: config.models.code,
            maxSequenceLength: 1024,
            vocabularySize: 100000,
            languageSupport: ['javascript', 'typescript', 'python', 'java', 'cpp']
        });
        this.imageProcessor = new image_1.ImageProcessor({
            ...baseConfig,
            modelPath: config.models.image,
            maxImageSize: 224,
            channels: 3,
            detectionThreshold: 0.5
        });
        this.audioProcessor = new audio_1.AudioProcessor({
            ...baseConfig,
            modelPath: config.models.audio,
            sampleRate: 16000,
            maxDuration: 30,
            audioFormat: 'wav'
        });
        this.videoProcessor = new video_1.VideoProcessor({
            ...baseConfig,
            modelPath: config.models.video,
            maxFrames: 300,
            frameRate: 30,
            resolution: {
                width: 1920,
                height: 1080
            }
        });
        this.crossModalFusion = new crossModalFusion_1.CrossModalFusion();
        this.featureExtractor = new advancedFeatureExtractor_1.AdvancedFeatureExtractor();
        this.attentionMechanism = new crossModalAttention_1.CrossModalAttention();
    }
    async initialize() {
        logger_1.logger.info('Initializing MultiModal Processor with advanced capabilities...');
        // Initialize all processors
        await Promise.all([
            this.textProcessor.initialize(),
            this.codeProcessor.initialize(),
            this.imageProcessor.initialize(),
            this.audioProcessor.initialize(),
            this.videoProcessor.initialize()
        ]);
        // Initialize advanced components
        await this.crossModalFusion.initialize();
        await this.featureExtractor.initialize();
        await this.attentionMechanism.initialize();
        logger_1.logger.info('MultiModal Processor initialized successfully');
    }
    async process(input) {
        try {
            // Extract features from each modality
            const features = await this.extractFeatures(input);
            // Apply cross-modal attention
            const attendedFeatures = await this.attentionMechanism.apply(features);
            // Perform cross-modal fusion
            const fusion = await this.crossModalFusion.fuse(attendedFeatures);
            // Extract advanced features
            const advancedFeatures = await this.featureExtractor.extract(attendedFeatures);
            return {
                text: input.text,
                code: input.code,
                image: input.image,
                audio: input.audio,
                video: input.video,
                features: advancedFeatures,
                fusion,
                metadata: {
                    modalities: Object.keys(input).filter(key => input[key] !== undefined),
                    processingTime: Date.now(),
                    modelVersion: this.config.modelVersion
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error processing multimodal input:', error);
            throw error;
        }
    }
    async extractFeatures(input) {
        const features = {};
        // Process each modality in parallel
        const [textFeatures, codeFeatures, imageFeatures, audioFeatures, videoFeatures] = await Promise.all([
            input.text ? this.textProcessor.extractFeatures(input.text) : Promise.resolve(undefined),
            input.code ? this.codeProcessor.extractFeatures(input.code) : Promise.resolve(undefined),
            input.image ? this.imageProcessor.extractFeatures(input.image) : Promise.resolve(undefined),
            input.audio ? this.audioProcessor.extractFeatures(input.audio) : Promise.resolve(undefined),
            input.video ? this.videoProcessor.extractFeatures(input.video) : Promise.resolve(undefined)
        ]);
        if (textFeatures)
            features.text = textFeatures;
        if (codeFeatures)
            features.code = codeFeatures;
        if (imageFeatures)
            features.image = imageFeatures;
        if (audioFeatures)
            features.audio = audioFeatures;
        if (videoFeatures)
            features.video = videoFeatures;
        return features;
    }
    dispose() {
        // Clean up resources
        this.textProcessor.dispose();
        this.codeProcessor.dispose();
        this.imageProcessor.dispose();
        this.audioProcessor.dispose();
        this.videoProcessor.dispose();
        this.crossModalFusion.dispose();
        this.featureExtractor.dispose();
        this.attentionMechanism.dispose();
        this.quantumEnhancer.dispose();
        this.securityManager.dispose();
        this.performanceOptimizer.dispose();
        this.advancedVisualizer.dispose();
        this.enterpriseMetrics.dispose();
        this.distributedProcessor.dispose();
    }
}
exports.MultiModalProcessor = MultiModalProcessor;
//# sourceMappingURL=processor.js.map