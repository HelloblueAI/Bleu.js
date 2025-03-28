"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTokenizer = loadTokenizer;
const promises_1 = __importDefault(require("fs/promises"));
const logger_1 = require("../../utils/logger");
async function loadTokenizer(configPath) {
    try {
        const configData = await promises_1.default.readFile(configPath, 'utf-8');
        const config = JSON.parse(configData);
        const vocabulary = new Map();
        const reverseVocabulary = new Map();
        config.vocabulary.forEach((token, index) => {
            vocabulary.set(token, index);
            reverseVocabulary.set(index, token);
        });
        const tokenizer = {
            vocabSize: config.vocabulary.length,
            async encode(text) {
                // Simple whitespace tokenization for demonstration
                // In a real implementation, you would use a more sophisticated tokenization algorithm
                const tokens = text.split(/\s+/);
                return tokens.map(token => vocabulary.get(token) ?? vocabulary.get(config.specialTokens.unk));
            },
            async decode(tokens) {
                return tokens
                    .map(token => reverseVocabulary.get(token) ?? config.specialTokens.unk)
                    .join(' ');
            }
        };
        logger_1.logger.info('Tokenizer loaded successfully', {
            vocabSize: tokenizer.vocabSize,
            maxLength: config.maxLength
        });
        return tokenizer;
    }
    catch (error) {
        logger_1.logger.error('Failed to load tokenizer', { error, configPath });
        throw new Error('Failed to load tokenizer');
    }
}
//# sourceMappingURL=tokenizer.js.map