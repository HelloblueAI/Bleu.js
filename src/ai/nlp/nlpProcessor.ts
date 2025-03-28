import { createLogger } from '@/utils/logger';

const logger = createLogger('NLPProcessor');

interface NLPConfig {
  language: string;
  maxTokens: number;
  minConfidence: number;
  useStemming: boolean;
  useStopWords: boolean;
}

interface TokenizationResult {
  tokens: string[];
  confidence: number;
}

interface EntityResult {
  text: string;
  type: string;
  confidence: number;
}

interface SentimentResult {
  score: number;
  confidence: number;
  label: 'positive' | 'negative' | 'neutral';
}

export class NLPProcessor {
  private config: NLPConfig;
  private stopWords: Set<string>;
  private stemmer: any;

  constructor(config: Partial<NLPConfig> = {}) {
    this.config = {
      language: 'en',
      maxTokens: 1000,
      minConfidence: 0.7,
      useStemming: true,
      useStopWords: true,
      ...config
    };

    this.stopWords = new Set();
    this.stemmer = null;
    logger.info(`Initialized NLP Processor with language: ${this.config.language}`);
  }

  async initialize(): Promise<void> {
    try {
      await this.loadStopWords();
      await this.initializeStemmer();
      logger.info('NLP Processor initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize NLP Processor:', error);
      throw error;
    }
  }

  async tokenize(text: string): Promise<TokenizationResult> {
    try {
      let tokens = text.toLowerCase().split(/\s+/);

      if (this.config.useStopWords) {
        tokens = tokens.filter(token => !this.stopWords.has(token));
      }

      if (this.config.useStemming && this.stemmer) {
        tokens = tokens.map(token => this.stemmer.stem(token));
      }

      const result: TokenizationResult = {
        tokens: tokens.slice(0, this.config.maxTokens),
        confidence: this.calculateConfidence(tokens)
      };

      logger.debug(`Tokenized text into ${result.tokens.length} tokens`);
      return result;
    } catch (error) {
      logger.error('Tokenization failed:', error);
      throw error;
    }
  }

  async extractEntities(text: string): Promise<EntityResult[]> {
    try {
      const entities: EntityResult[] = [];
      const patterns = this.getEntityPatterns();

      for (const [type, pattern] of Object.entries(patterns)) {
        const matches = text.match(pattern);
        if (matches) {
          matches.forEach(match => {
            if (this.validateEntity(match)) {
              entities.push({
                text: match,
                type,
                confidence: this.calculateEntityConfidence(match, type)
              });
            }
          });
        }
      }

      logger.debug(`Extracted ${entities.length} entities from text`);
      return entities;
    } catch (error) {
      logger.error('Entity extraction failed:', error);
      throw error;
    }
  }

  async analyzeSentiment(text: string): Promise<SentimentResult> {
    try {
      const tokens = await this.tokenize(text);
      const score = this.calculateSentimentScore(tokens.tokens);
      const confidence = this.calculateSentimentConfidence(score);

      const result: SentimentResult = {
        score,
        confidence,
        label: this.getSentimentLabel(score)
      };

      logger.debug(`Sentiment analysis result: ${result.label} (score: ${result.score})`);
      return result;
    } catch (error) {
      logger.error('Sentiment analysis failed:', error);
      throw error;
    }
  }

  private async loadStopWords(): Promise<void> {
    // Simulated stop words loading
    const commonStopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at'];
    this.stopWords = new Set(commonStopWords);
  }

  private async initializeStemmer(): Promise<void> {
    // Simulated stemmer initialization
    this.stemmer = {
      stem: (word: string) => word.toLowerCase()
    };
  }

  private calculateConfidence(tokens: string[]): number {
    return tokens.length > 0 ? 0.9 : 0.5;
  }

  private getEntityPatterns(): Record<string, RegExp> {
    return {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
      phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
      url: /https?:\/\/[^\s]+/,
      date: /\b\d{4}-\d{2}-\d{2}\b/
    };
  }

  private validateEntity(entity: string): boolean {
    return entity.length > 0 && entity.length < 100;
  }

  private calculateEntityConfidence(entity: string, type: string): number {
    return entity.length > 5 ? 0.9 : 0.7;
  }

  private calculateSentimentScore(tokens: string[]): number {
    // Simulated sentiment scoring
    return Math.random() * 2 - 1; // Range: -1 to 1
  }

  private calculateSentimentConfidence(score: number): number {
    return Math.abs(score) > 0.5 ? 0.9 : 0.7;
  }

  private getSentimentLabel(score: number): 'positive' | 'negative' | 'neutral' {
    if (score > 0.2) return 'positive';
    if (score < -0.2) return 'negative';
    return 'neutral';
  }
} 