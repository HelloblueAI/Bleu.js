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
exports.analyze = void 0;
exports.analyze = analyze;
const commander_1 = require("commander");
const logger_1 = require("../utils/logger");
const bleuAI_1 = require("../ai/bleuAI");
exports.analyze = new commander_1.Command()
    .name('bleu analyze')
    .description('Analyze code using BleuAI')
    .option('-f, --file <file>', 'File to analyze')
    .option('-c, --code <code>', 'Code to analyze')
    .option('-m, --model <model>', 'AI model to use (bleu or huggingface)', 'bleu')
    .option('--bleu-key <key>', 'BleuAI API key')
    .action(async (options) => {
    try {
        let text = options.code;
        if (options.file) {
            text = await readFile(options.file);
        }
        if (!text) {
            throw new Error('No code provided');
        }
        let result;
        switch (options.model) {
            case 'bleu':
                result = await analyzeWithBleuAI(text, options.bleuKey);
                break;
            case 'huggingface':
                result = await analyzeWithHuggingFace(text);
                break;
            default:
                throw new Error(`Unsupported model: ${options.model}`);
        }
        console.log(result);
    }
    catch (error) {
        logger_1.logger.error('Code analysis failed', { error });
        process.exit(1);
    }
});
async function readFile(filePath) {
    try {
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        return await fs.readFile(filePath, 'utf-8');
    }
    catch (error) {
        logger_1.logger.error('Failed to read file', { error, filePath });
        throw new Error(`Failed to read file: ${filePath}`);
    }
}
async function analyzeWithBleuAI(text, apiKey) {
    if (!apiKey && !process.env.BLEU_API_KEY) {
        throw new Error('BleuAI API key is required');
    }
    const bleuAI = new bleuAI_1.BleuAI({
        apiKey: apiKey || process.env.BLEU_API_KEY,
        model: 'bleu-code-analyzer',
        maxTokens: 2048,
        temperature: 0.7
    });
    const response = await bleuAI.analyze({
        prompt: `Analyze this code:\n${text}`,
        maxTokens: 2048,
        temperature: 0.7
    });
    return response;
}
async function analyzeWithHuggingFace(text) {
    // Implement HuggingFace analysis
    return { message: 'HuggingFace analysis not implemented yet' };
}
async function analyze(options) {
    try {
        logger_1.logger.info('Initializing BleuAI...');
        const bleuAI = new bleuAI_1.BleuAI(options.config);
        await bleuAI.initialize();
        logger_1.logger.info(`Analyzing code at ${options.path}...`);
        const result = await bleuAI.processInput(options.path);
        if (options.output === 'json') {
            console.log(JSON.stringify(result, null, 2));
        }
        else {
            console.log(result);
        }
        await bleuAI.dispose();
    }
    catch (error) {
        logger_1.logger.error('Error analyzing code:', error);
        throw error;
    }
}
//# sourceMappingURL=analyze.js.map