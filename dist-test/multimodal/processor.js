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
exports.MultiModalProcessor = void 0;
const tf = __importStar(require("@tensorflow/tfjs"));
const logger_1 = require("../utils/logger");
const crossModalFusion_1 = require("./fusion/crossModalFusion");
const advancedFeatureExtractor_1 = require("./extractors/advancedFeatureExtractor");
const crossModalAttention_1 = require("./attention/crossModalAttention");
const visionLanguageModel_1 = require("./models/visionLanguageModel");
const audioVisualFusion_1 = require("./fusion/audioVisualFusion");
const textCodeFusion_1 = require("./fusion/textCodeFusion");
class MultiModalProcessor {
    constructor(config) {
        this.config = config;
        this.crossModalFusion = new crossModalFusion_1.CrossModalFusion();
        this.featureExtractor = new advancedFeatureExtractor_1.AdvancedFeatureExtractor();
        this.crossModalAttention = new crossModalAttention_1.CrossModalAttention();
        this.visionLanguageModel = new visionLanguageModel_1.VisionLanguageModel();
        this.audioVisualFusion = new audioVisualFusion_1.AudioVisualFusion();
        this.textCodeFusion = new textCodeFusion_1.TextCodeFusion();
        this.metrics = {
            fusionQuality: 0,
            attentionScore: 0,
            featureQuality: 0,
            crossModalAlignment: 0
        };
    }
    async initialize() {
        logger_1.logger.info('Initializing MultiModal Processor with advanced capabilities...');
        try {
            await Promise.all([
                this.crossModalFusion.initialize(),
                this.featureExtractor.initialize(),
                this.crossModalAttention.initialize(),
                this.visionLanguageModel.initialize(),
                this.audioVisualFusion.initialize(),
                this.textCodeFusion.initialize()
            ]);
            logger_1.logger.info('✅ MultiModal Processor initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to initialize MultiModal Processor:', error);
            throw error;
        }
    }
    async process(input) {
        try {
            // Extract features from each modality
            const features = await this.extractFeatures(input);
            // Apply cross-modal attention
            const attendedFeatures = await this.crossModalAttention.attend(features);
            // Apply cross-modal fusion
            const fusedFeatures = await this.crossModalFusion.fuse(attendedFeatures);
            // Apply specialized fusion for specific modalities
            const specializedFeatures = await this.applySpecializedFusion(features);
            // Combine all features
            const combinedFeatures = await this.combineFeatures(fusedFeatures, specializedFeatures);
            // Update metrics
            this.updateMetrics(features, combinedFeatures);
            return {
                features: combinedFeatures,
                metrics: this.metrics,
                attention: attendedFeatures,
                fusion: fusedFeatures
            };
        }
        catch (error) {
            logger_1.logger.error('❌ MultiModal processing failed:', error);
            throw error;
        }
    }
    async extractFeatures(input) {
        const features = {};
        if (input.text) {
            features.text = await this.featureExtractor.extractText(input.text);
        }
        if (input.code) {
            features.code = await this.featureExtractor.extractCode(input.code);
        }
        if (input.image) {
            features.image = await this.featureExtractor.extractImage(input.image);
        }
        if (input.audio) {
            features.audio = await this.featureExtractor.extractAudio(input.audio);
        }
        if (input.video) {
            features.video = await this.featureExtractor.extractVideo(input.video);
        }
        return features;
    }
    async applySpecializedFusion(features) {
        const specializedFeatures = [];
        // Apply vision-language fusion if both modalities are present
        if (features.image && features.text) {
            const visionLanguageFeatures = await this.visionLanguageModel.process(features.image, features.text);
            specializedFeatures.push(visionLanguageFeatures);
        }
        // Apply audio-visual fusion if both modalities are present
        if (features.audio && features.video) {
            const audioVisualFeatures = await this.audioVisualFusion.process(features.audio, features.video);
            specializedFeatures.push(audioVisualFeatures);
        }
        // Apply text-code fusion if both modalities are present
        if (features.text && features.code) {
            const textCodeFeatures = await this.textCodeFusion.process(features.text, features.code);
            specializedFeatures.push(textCodeFeatures);
        }
        // Combine specialized features
        if (specializedFeatures.length > 0) {
            return tf.concat(specializedFeatures, -1);
        }
        return tf.tensor([]);
    }
    async combineFeatures(fusedFeatures, specializedFeatures) {
        if (specializedFeatures.shape[0] === 0) {
            return fusedFeatures;
        }
        return tf.concat([fusedFeatures, specializedFeatures], -1);
    }
    updateMetrics(features, combinedFeatures) {
        this.metrics = {
            fusionQuality: this.crossModalFusion.getQuality(),
            attentionScore: this.crossModalAttention.getScore(),
            featureQuality: this.featureExtractor.getQuality(),
            crossModalAlignment: this.calculateCrossModalAlignment(features)
        };
    }
    calculateCrossModalAlignment(features) {
        // Calculate alignment score between different modalities
        const modalities = Object.keys(features);
        let totalAlignment = 0;
        let count = 0;
        for (let i = 0; i < modalities.length; i++) {
            for (let j = i + 1; j < modalities.length; j++) {
                const mod1 = modalities[i];
                const mod2 = modalities[j];
                if (features[mod1] && features[mod2]) {
                    totalAlignment += this.crossModalAttention.getAlignmentScore(features[mod1], features[mod2]);
                    count++;
                }
            }
        }
        return count > 0 ? totalAlignment / count : 0;
    }
    getMetrics() {
        return this.metrics;
    }
    async dispose() {
        await Promise.all([
            this.crossModalFusion.dispose(),
            this.featureExtractor.dispose(),
            this.crossModalAttention.dispose(),
            this.visionLanguageModel.dispose(),
            this.audioVisualFusion.dispose(),
            this.textCodeFusion.dispose()
        ]);
    }
}
exports.MultiModalProcessor = MultiModalProcessor;
//# sourceMappingURL=processor.js.map