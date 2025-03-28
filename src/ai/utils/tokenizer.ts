import fs from 'fs/promises';
import { Tokenizer } from '../models/bleuAI';
import { logger } from '../../utils/logger';

export interface TokenizerConfig {
  vocabulary: string[];
  maxLength: number;
  specialTokens: {
    pad: string;
    unk: string;
    bos: string;
    eos: string;
  };
}

export async function loadTokenizer(configPath: string): Promise<Tokenizer> {
  try {
    const configData = await fs.readFile(configPath, 'utf-8');
    const config: TokenizerConfig = JSON.parse(configData);

    const vocabulary = new Map<string, number>();
    const reverseVocabulary = new Map<number, string>();

    config.vocabulary.forEach((token, index) => {
      vocabulary.set(token, index);
      reverseVocabulary.set(index, token);
    });

    const tokenizer: Tokenizer = {
      vocabSize: config.vocabulary.length,

      async encode(text: string): Promise<number[]> {
        // Simple whitespace tokenization for demonstration
        // In a real implementation, you would use a more sophisticated tokenization algorithm
        const tokens = text.split(/\s+/);
        return tokens.map(token => 
          vocabulary.get(token) ?? vocabulary.get(config.specialTokens.unk)!
        );
      },

      async decode(tokens: number[]): Promise<string> {
        return tokens
          .map(token => reverseVocabulary.get(token) ?? config.specialTokens.unk)
          .join(' ');
      }
    };

    logger.info('Tokenizer loaded successfully', {
      vocabSize: tokenizer.vocabSize,
      maxLength: config.maxLength
    });

    return tokenizer;
  } catch (error) {
    logger.error('Failed to load tokenizer', { error, configPath });
    throw new Error('Failed to load tokenizer');
  }
}