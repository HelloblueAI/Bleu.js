"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeAnalyzer = void 0;
const bleuAI_1 = require("./bleuAI");
const logger_1 = require("../utils/logger");
class CodeAnalyzer {
    constructor(config) {
        this.config = config;
        this.bleuAI = new bleuAI_1.BleuAI({
            apiKey: this.config.bleuApiKey,
            model: 'bleu-code-analyzer',
            maxTokens: 2048,
            temperature: 0.7
        });
    }
    async analyzeCode(code) {
        try {
            const response = await this.bleuAI.analyze({
                prompt: `Analyze this code:\n${code}`,
                maxTokens: 2048,
                temperature: 0.7
            });
            return response;
        }
        catch (error) {
            logger_1.logger.error('Code analysis failed', { error });
            throw new Error('Code analysis failed');
        }
    }
    async generateCode(prompt) {
        try {
            const response = await this.bleuAI.generate({
                prompt,
                maxTokens: 2048,
                temperature: 0.7
            });
            return response;
        }
        catch (error) {
            logger_1.logger.error('Code generation failed', { error });
            throw new Error('Code generation failed');
        }
    }
    async optimizeCode(code) {
        try {
            const response = await this.bleuAI.optimize({
                prompt: `Optimize this code:\n${code}`,
                maxTokens: 2048,
                temperature: 0.7
            });
            return response;
        }
        catch (error) {
            logger_1.logger.error('Code optimization failed', { error });
            throw new Error('Code optimization failed');
        }
    }
    async refactorCode(code) {
        try {
            const response = await this.bleuAI.refactor({
                prompt: `Refactor this code:\n${code}`,
                maxTokens: 2048,
                temperature: 0.7
            });
            return response;
        }
        catch (error) {
            logger_1.logger.error('Code refactoring failed', { error });
            throw new Error('Code refactoring failed');
        }
    }
}
exports.CodeAnalyzer = CodeAnalyzer;
//# sourceMappingURL=codeAnalyzer.js.map