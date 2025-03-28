import { createLogger } from '@/utils/logger';

const logger = createLogger('BleuAI');

export interface BleuAIConfig {
  vocabularySize: number;
  maxSequenceLength: number;
  specialTokens?: string[];
  tokenizationRules?: {
    caseSensitive?: boolean;
    handlePunctuation?: boolean;
    handleNumbers?: boolean;
    handleEmojis?: boolean;
  };
}

export class BleuAI {
  private config: BleuAIConfig;
  private vocabulary: Map<string, number>;
  private reverseVocabulary: Map<number, string>;
  private specialTokens: Set<string>;

  constructor(config: BleuAIConfig) {
    this.config = {
      specialTokens: ['<PAD>', '<UNK>', '<CLS>', '<SEP>', '<MASK>'],
      tokenizationRules: {
        caseSensitive: false,
        handlePunctuation: true,
        handleNumbers: true,
        handleEmojis: true
      },
      ...config
    };

    this.vocabulary = new Map();
    this.reverseVocabulary = new Map();
    this.specialTokens = new Set(this.config.specialTokens);

    this.initializeVocabulary();
  }

  private initializeVocabulary(): void {
    // Add special tokens first
    this.config.specialTokens?.forEach((token, index) => {
      this.vocabulary.set(token, index);
      this.reverseVocabulary.set(index, token);
    });
  }

  tokenize(text: string): number[] {
    try {
      const tokens = this.preprocess(text);
      return tokens.map(token => this.getTokenId(token));
    } catch (error) {
      logger.error('Error tokenizing text:', error);
      throw error;
    }
  }

  private preprocess(text: string): string[] {
    let processedText = text;

    if (!this.config.tokenizationRules?.caseSensitive) {
      processedText = processedText.toLowerCase();
    }

    if (this.config.tokenizationRules?.handlePunctuation) {
      processedText = this.handlePunctuation(processedText);
    }

    if (this.config.tokenizationRules?.handleNumbers) {
      processedText = this.handleNumbers(processedText);
    }

    if (this.config.tokenizationRules?.handleEmojis) {
      processedText = this.handleEmojis(processedText);
    }

    return processedText.split(' ').filter(token => token.length > 0);
  }

  private handlePunctuation(text: string): string {
    // Add spaces around punctuation for better tokenization
    return text.replace(/([.,!?;:])/g, ' $1 ');
  }

  private handleNumbers(text: string): string {
    // Handle different number formats
    return text.replace(/(\d+)/g, ' <NUMBER> ');
  }

  private handleEmojis(text: string): string {
    // Handle emojis and emoticons
    return text.replace(/([\u{1F300}-\u{1F9FF}])/gu, ' <EMOJI> ');
  }

  private getTokenId(token: string): number {
    if (this.vocabulary.has(token)) {
      return this.vocabulary.get(token)!;
    }

    // If token not in vocabulary, return UNK token ID
    return this.vocabulary.get('<UNK>')!;
  }

  decode(tokenIds: number[]): string {
    try {
      return tokenIds
        .map(id => this.reverseVocabulary.get(id) || '<UNK>')
        .join(' ')
        .replace(/ ([.,!?;:]) /g, '$1') // Clean up punctuation spacing
        .trim();
    } catch (error) {
      logger.error('Error decoding tokens:', error);
      throw error;
    }
  }

  async buildVocabulary(texts: string[]): Promise<void> {
    try {
      const wordFreq = new Map<string, number>();

      // Process all texts
      for (const text of texts) {
        const tokens = this.preprocess(text);
        tokens.forEach(token => {
          wordFreq.set(token, (wordFreq.get(token) || 0) + 1);
        });
      }

      // Sort by frequency and take top N words
      const sortedWords = Array.from(wordFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, this.config.vocabularySize - this.specialTokens.size)
        .map(([word]) => word);

      // Reset vocabulary
      this.vocabulary.clear();
      this.reverseVocabulary.clear();

      // Add special tokens first
      this.initializeVocabulary();

      // Add remaining words
      let id = this.specialTokens.size;
      for (const word of sortedWords) {
        if (!this.specialTokens.has(word)) {
          this.vocabulary.set(word, id);
          this.reverseVocabulary.set(id, word);
          id++;
        }
      }

      logger.info(`Built vocabulary with ${this.vocabulary.size} tokens`);
    } catch (error) {
      logger.error('Error building vocabulary:', error);
      throw error;
    }
  }

  getVocabularySize(): number {
    return this.vocabulary.size;
  }

  isSpecialToken(token: string): boolean {
    return this.specialTokens.has(token);
  }
} 