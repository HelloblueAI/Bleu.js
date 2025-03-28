import { createLogger } from './logger';

const logger = createLogger('Tokenizer');

export interface TokenizerConfig {
  maxLength?: number;
  padToken?: string;
  unknownToken?: string;
  vocabulary?: Map<string, number>;
}

export class Tokenizer {
  private maxLength: number;
  private padToken: string;
  private unknownToken: string;
  private vocabulary: Map<string, number>;
  private reverseVocabulary: Map<number, string>;

  constructor(config: TokenizerConfig = {}) {
    this.maxLength = config.maxLength || 512;
    this.padToken = config.padToken || '[PAD]';
    this.unknownToken = config.unknownToken || '[UNK]';
    this.vocabulary = config.vocabulary || new Map();
    this.reverseVocabulary = new Map();
    
    if (this.vocabulary.size === 0) {
      this.initializeDefaultVocabulary();
    }
    
    this.buildReverseVocabulary();
  }

  private initializeDefaultVocabulary(): void {
    this.vocabulary.set(this.padToken, 0);
    this.vocabulary.set(this.unknownToken, 1);
  }

  private buildReverseVocabulary(): void {
    this.vocabulary.forEach((id, token) => {
      this.reverseVocabulary.set(id, token);
    });
  }

  public tokenize(text: string): number[] {
    try {
      const tokens = text.toLowerCase().split(/\s+/);
      return tokens.map(token => {
        const id = this.vocabulary.get(token);
        return id !== undefined ? id : this.vocabulary.get(this.unknownToken)!;
      });
    } catch (error) {
      logger.error('Error during tokenization:', error);
      throw new Error('Failed to tokenize text');
    }
  }

  public decode(ids: number[]): string {
    try {
      return ids
        .map(id => this.reverseVocabulary.get(id) || this.unknownToken)
        .join(' ');
    } catch (error) {
      logger.error('Error during decoding:', error);
      throw new Error('Failed to decode token IDs');
    }
  }

  public pad(tokens: number[]): number[] {
    if (tokens.length >= this.maxLength) {
      return tokens.slice(0, this.maxLength);
    }
    
    const padId = this.vocabulary.get(this.padToken)!;
    return [...tokens, ...Array(this.maxLength - tokens.length).fill(padId)];
  }

  public addToken(token: string): void {
    if (!this.vocabulary.has(token)) {
      const newId = this.vocabulary.size;
      this.vocabulary.set(token, newId);
      this.reverseVocabulary.set(newId, token);
      logger.info(`Added new token: ${token} with ID: ${newId}`);
    }
  }

  public getVocabularySize(): number {
    return this.vocabulary.size;
  }

  public getMaxLength(): number {
    return this.maxLength;
  }

  public setMaxLength(length: number): void {
    if (length > 0) {
      this.maxLength = length;
      logger.info(`Updated max length to: ${length}`);
    } else {
      throw new Error('Max length must be greater than 0');
    }
  }
} 