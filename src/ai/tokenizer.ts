import { createLogger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

const logger = createLogger('Tokenizer');

export interface TokenizerConfig {
  language: string;
  maxLength?: number;
  caseSensitive?: boolean;
  vocabularyPath?: string;
}

export class Tokenizer {
  private config: TokenizerConfig;
  private vocabulary: Map<string, number>;
  private isInitialized: boolean;

  constructor(config: TokenizerConfig) {
    this.config = {
      language: config.language || 'en',
      maxLength: config.maxLength || 512,
      caseSensitive: config.caseSensitive || false,
      vocabularyPath: config.vocabularyPath || path.join(process.cwd(), 'data', 'vocabulary.json')
    };
    this.vocabulary = new Map();
    this.isInitialized = false;
    logger.info(`Initialized tokenizer with language: ${this.config.language}`);
  }

  async loadVocabulary(): Promise<void> {
    try {
      const vocabDir = path.dirname(this.config.vocabularyPath!);
      await fs.mkdir(vocabDir, { recursive: true });

      try {
        const data = await fs.readFile(this.config.vocabularyPath!, 'utf-8');
        const vocabObject = JSON.parse(data);
        this.vocabulary = new Map(Object.entries(vocabObject));
        logger.info(`Loaded vocabulary with ${this.vocabulary.size} tokens`);
      } catch (error) {
        // If file doesn't exist or is invalid, create a new vocabulary
        logger.warn('No existing vocabulary found, creating new one');
        this.vocabulary = new Map();
        await this.saveVocabulary();
      }

      this.isInitialized = true;
    } catch (error) {
      logger.error('Error loading vocabulary:', error);
      throw error;
    }
  }

  private async saveVocabulary(): Promise<void> {
    try {
      const vocabObject = Object.fromEntries(this.vocabulary.entries());
      await fs.writeFile(
        this.config.vocabularyPath!,
        JSON.stringify(vocabObject, null, 2)
      );
      logger.debug('Saved vocabulary to file');
    } catch (error) {
      logger.error('Error saving vocabulary:', error);
      throw error;
    }
  }

  tokenize(text: string): string[] {
    if (!text) {
      logger.warn('Empty text provided for tokenization');
      return [];
    }

    // Normalize text based on configuration
    let processedText = this.config.caseSensitive ? text : text.toLowerCase();

    // Split into tokens (simple whitespace-based tokenization)
    const tokens = processedText
      .split(/\s+/)
      .filter(token => token.length > 0)
      .slice(0, this.config.maxLength);

    logger.debug(`Tokenized text into ${tokens.length} tokens`);
    return tokens;
  }

  encode(text: string): number[] {
    const tokens = this.tokenize(text);
    const encoded = tokens.map(token => {
      if (!this.vocabulary.has(token)) {
        this.vocabulary.set(token, this.vocabulary.size);
        this.saveVocabulary().catch(error => {
          logger.error('Error saving vocabulary:', error);
        });
      }
      return this.vocabulary.get(token)!;
    });

    logger.debug(`Encoded ${encoded.length} tokens`);
    return encoded;
  }

  decode(ids: number[]): string {
    const reverseVocab = new Map(
      Array.from(this.vocabulary.entries()).map(([k, v]) => [v, k])
    );

    const decoded = ids
      .map(id => reverseVocab.get(id) || '')
      .filter(token => token.length > 0)
      .join(' ');

    logger.debug(`Decoded ${ids.length} tokens`);
    return decoded;
  }

  getVocabularySize(): number {
    return this.vocabulary.size;
  }

  async dispose(): Promise<void> {
    try {
      await this.saveVocabulary();
      this.vocabulary.clear();
      this.isInitialized = false;
      logger.info('Disposed tokenizer resources');
    } catch (error) {
      logger.error('Error disposing tokenizer:', error);
      throw error;
    }
  }
} 