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
exports.loadModelConfig = loadModelConfig;
const fs = __importStar(require("fs"));
async function loadModelConfig(configPath) {
    try {
        const config = JSON.parse(await fs.promises.readFile(configPath, 'utf-8'));
        validateConfig(config);
        return config;
    }
    catch (error) {
        console.error('Error loading model config:', error);
        throw error;
    }
}
function validateConfig(config) {
    const required = [
        'architecture',
        'training',
        'inference'
    ];
    const architectureRequired = [
        'type',
        'layers',
        'attentionHeads',
        'hiddenSize',
        'vocabularySize',
        'maxSequenceLength'
    ];
    const trainingRequired = [
        'batchSize',
        'learningRate',
        'epochs',
        'warmupSteps'
    ];
    const inferenceRequired = [
        'defaultMaxTokens',
        'defaultTemperature',
        'defaultTopP'
    ];
    // Check top-level keys
    for (const key of required) {
        if (!(key in config)) {
            throw new Error(`Missing required config key: ${key}`);
        }
    }
    // Check architecture keys
    for (const key of architectureRequired) {
        if (!(key in config.architecture)) {
            throw new Error(`Missing required architecture config key: ${key}`);
        }
    }
    // Check training keys
    for (const key of trainingRequired) {
        if (!(key in config.training)) {
            throw new Error(`Missing required training config key: ${key}`);
        }
    }
    // Check inference keys
    for (const key of inferenceRequired) {
        if (!(key in config.inference)) {
            throw new Error(`Missing required inference config key: ${key}`);
        }
    }
    // Validate value ranges
    if (config.architecture.layers <= 0) {
        throw new Error('Number of layers must be positive');
    }
    if (config.architecture.attentionHeads <= 0) {
        throw new Error('Number of attention heads must be positive');
    }
    if (config.architecture.hiddenSize <= 0) {
        throw new Error('Hidden size must be positive');
    }
    if (config.architecture.vocabularySize <= 0) {
        throw new Error('Vocabulary size must be positive');
    }
    if (config.architecture.maxSequenceLength <= 0) {
        throw new Error('Max sequence length must be positive');
    }
    if (config.training.batchSize <= 0) {
        throw new Error('Batch size must be positive');
    }
    if (config.training.learningRate <= 0) {
        throw new Error('Learning rate must be positive');
    }
    if (config.training.epochs <= 0) {
        throw new Error('Number of epochs must be positive');
    }
    if (config.inference.defaultTemperature <= 0 || config.inference.defaultTemperature > 2) {
        throw new Error('Temperature must be between 0 and 2');
    }
    if (config.inference.defaultTopP <= 0 || config.inference.defaultTopP > 1) {
        throw new Error('Top-p must be between 0 and 1');
    }
}
//# sourceMappingURL=config.js.map