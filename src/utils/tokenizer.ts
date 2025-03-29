import { createLogger } from './logger';
import { SecurityError } from '../types/errors';

const logger = createLogger('Tokenizer');

export interface TokenizerConfig {
  maxLength?: number;
  padToken?: string;
  unknownToken?: string;
  vocabulary?: Map<string, number>;
  sanitizeInput?: (input: string) => string;
  maxTokenLength?: number;
  cacheSize?: number;
}

export class Tokenizer {
  private readonly padToken: string;
  private readonly unknownToken: string;
  private readonly vocabulary: Map<string, number>;
  private readonly reverseVocabulary: Map<number, string>;
  private readonly sanitizeInput: (input: string) => string;
  private readonly maxTokenLength: number;
  private readonly tokenCache: Map<string, number[]>;
  private readonly CACHE_SIZE: number;

  constructor(config: TokenizerConfig = {}) {
    this.padToken = config.padToken ?? '<pad>';
    this.unknownToken = config.unknownToken ?? '<unk>';
    this.vocabulary = new Map();
    this.reverseVocabulary = new Map();
    this.sanitizeInput = config.sanitizeInput ?? ((input: string) => input.toLowerCase().trim());
    this.maxTokenLength = config.maxTokenLength ?? 512;
    this.CACHE_SIZE = config.cacheSize ?? 1000;
    this.tokenCache = new Map();
    
    if (config.vocabulary) {
      Object.entries(config.vocabulary).forEach(([token, index]) => {
        this.vocabulary.set(token, index);
        this.reverseVocabulary.set(index, token);
      });
    }
    
    this.validateConfig();
  }

  private validateConfig(): void {
    if (this.maxTokenLength <= 0) {
      throw new SecurityError('Invalid maxTokenLength configuration', 'INVALID_CONFIG');
    }
    if (this.CACHE_SIZE <= 0) {
      throw new SecurityError('Invalid cacheSize configuration', 'INVALID_CONFIG');
    }
  }

  private sanitizeText(text: string): string {
    if (typeof text !== 'string') {
      throw new SecurityError('Invalid input type for text sanitization', 'INVALID_INPUT');
    }
    
    // Remove potentially dangerous characters
    return text
      .replace(/[^\w\s.,!?-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, this.maxTokenLength);
  }

  private updateCache(text: string, tokens: number[]): void {
    if (this.tokenCache.size >= this.CACHE_SIZE) {
      // Remove oldest entry
      const firstKey = this.tokenCache.keys().next().value;
      this.tokenCache.delete(firstKey);
    }
    this.tokenCache.set(text, tokens);
  }

  public tokenize(text: string): number[] {
    try {
      // Check cache first
      if (this.tokenCache.has(text)) {
        return this.tokenCache.get(text) ?? [];
      }

      const sanitizedText = this.sanitizeText(text);
      
      // Use a more efficient tokenization approach
      const tokens = sanitizedText
        .toLowerCase()
        .split(/\s+/)
        .filter(token => token.length > 0)
        .map(token => {
          const id = this.vocabulary.get(token);
          return id !== undefined ? id : this.vocabulary.get(this.unknownToken) ?? 0;
        });

      // Update cache
      this.updateCache(text, tokens);
      
      return tokens;
    } catch (error) {
      logger.error('Error during tokenization:', error);
      throw new SecurityError('Failed to tokenize text', 'TOKENIZATION_ERROR');
    }
  }

  public encode(text: string): number[] {
    try {
      const sanitized = this.sanitizeInput(text);
      const cacheKey = `${sanitized}_${this.maxTokenLength}`;
      
      if (this.tokenCache.has(cacheKey)) {
        return this.tokenCache.get(cacheKey) ?? [];
      }

      const tokens = this.tokenize(sanitized);
      const encoded = tokens.map(token => this.vocabulary.get(token) ?? this.vocabulary.get(this.unknownToken) ?? 0);
      
      // Pad or truncate to maxTokenLength
      const result = encoded.length > this.maxTokenLength 
        ? encoded.slice(0, this.maxTokenLength)
        : [...encoded, ...Array(this.maxTokenLength - encoded.length).fill(this.vocabulary.get(this.padToken) ?? 0)];
      
      this.tokenCache.set(cacheKey, result);
      return result;
    } catch (error) {
      logger.error('Error during encoding:', error);
      throw new SecurityError('Failed to encode text', 'ENCODING_ERROR');
    }
  }

  public decode(tokens: number[]): string {
    try {
      if (!Array.isArray(tokens) || tokens.some(token => typeof token !== 'number')) {
        throw new SecurityError('Invalid input for decoding', 'INVALID_INPUT');
      }

      return tokens
        .map(token => this.reverseVocabulary.get(token) ?? this.unknownToken)
        .filter(token => token !== this.padToken)
        .join(' ');
    } catch (error) {
      logger.error('Error during decoding:', error);
      throw new SecurityError('Failed to decode tokens', 'DECODING_ERROR');
    }
  }

  public pad(tokens: number[]): number[] {
    if (!Array.isArray(tokens) || tokens.some(token => typeof token !== 'number')) {
      throw new SecurityError('Invalid input for padding', 'INVALID_INPUT');
    }

    if (tokens.length >= this.maxTokenLength) {
      return tokens.slice(0, this.maxTokenLength);
    }
    
    const padId = this.vocabulary.get(this.padToken) ?? 0;
    return [...tokens, ...Array(this.maxTokenLength - tokens.length).fill(padId)];
  }

  public addToken(token: string): void {
    if (typeof token !== 'string' || token.length === 0) {
      throw new SecurityError('Invalid token for addition', 'INVALID_TOKEN');
    }

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
    return this.maxTokenLength;
  }

  public clearCache(): void {
    this.tokenCache.clear();
  }
} 