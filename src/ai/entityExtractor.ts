import { createLogger } from '../utils/logger';

const logger = createLogger('EntityExtractor');

export interface EntityRule {
  pattern: RegExp;
  type: string;
  attributes?: Record<string, any>;
}

export interface EntityExtractorConfig {
  rules?: EntityRule[];
  caseSensitive?: boolean;
  maxMatches?: number;
  language?: string;
  modelPath?: string;
}

export interface Entity {
  type: string;
  value: string;
  start: number;
  end: number;
  attributes?: Record<string, any>;
}

export class EntityExtractor {
  private config: EntityExtractorConfig;
  private rules: EntityRule[];
  private isInitialized: boolean;

  constructor(config: EntityExtractorConfig = {}) {
    this.config = {
      caseSensitive: false,
      maxMatches: 100,
      language: 'en',
      ...config
    };
    this.rules = [];
    this.isInitialized = false;
  }

  async loadRules(): Promise<void> {
    try {
      // Load default rules
      this.rules = [
        {
          pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
          type: 'ip_address',
          attributes: { format: 'ipv4' }
        },
        {
          pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
          type: 'email'
        },
        {
          pattern: /\b(?:\+\d{1,3}[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b/,
          type: 'phone_number'
        },
        {
          pattern: /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/,
          type: 'date'
        },
        {
          pattern: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/,
          type: 'proper_name'
        },
        {
          pattern: /\$\d+(?:\.\d{2})?/,
          type: 'currency',
          attributes: { currency: 'USD' }
        },
        {
          pattern: /https?:\/\/[^\s/$.?#].[^\s]*/,
          type: 'url'
        },
        {
          pattern: /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i,
          type: 'day_of_week'
        },
        {
          pattern: /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b/i,
          type: 'month'
        }
      ];

      // Append custom rules if provided
      if (this.config.rules) {
        this.rules.push(...this.config.rules);
      }

      this.isInitialized = true;
      logger.info(`Loaded ${this.rules.length} entity extraction rules`);
    } catch (error) {
      logger.error('Failed to load entity extraction rules', { error });
      throw error;
    }
  }

  async extract(text: string): Promise<Entity[]> {
    if (!this.isInitialized) {
      throw new Error('Entity extractor not initialized. Call loadRules() first.');
    }

    const matches: Entity[] = [];
    const flags = this.config.caseSensitive ? 'g' : 'gi';

    for (const rule of this.rules) {
      const pattern = new RegExp(rule.pattern, flags);
      let match;

      while ((match = pattern.exec(text)) !== null) {
        if (matches.length >= (this.config.maxMatches || 100)) {
          break;
        }

        matches.push({
          type: rule.type,
          value: match[0],
          start: match.index,
          end: match.index + match[0].length,
          attributes: rule.attributes
        });
      }
    }

    return matches;
  }

  addRule(rule: EntityRule): void {
    this.rules.push(rule);
    logger.info(`Added new entity extraction rule for type: ${rule.type}`);
  }

  removeRule(type: string): void {
    this.rules = this.rules.filter(rule => rule.type !== type);
    logger.info(`Removed entity extraction rules for type: ${type}`);
  }

  getRules(): EntityRule[] {
    return [...this.rules];
  }

  async dispose(): Promise<void> {
    this.rules = [];
    this.isInitialized = false;
    logger.info('Disposed entity extractor');
  }
} 