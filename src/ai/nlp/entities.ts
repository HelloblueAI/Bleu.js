import { createLogger } from '../../utils/logger';
import * as tf from '@tensorflow/tfjs-node';

export interface Entity {
  text: string;
  type: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface EntityType {
  name: string;
  description: string;
  examples: string[];
  attributes: string[];
}

export interface EntityRelation {
  source: string;
  target: string;
  type: string;
  confidence: number;
}

export interface EntityContext {
  sentence: string;
  paragraph: string;
  document: string;
  position: {
    start: number;
    end: number;
  };
}

export interface EntityAnnotation {
  entity: Entity;
  context: EntityContext;
  metadata: Record<string, any>;
}

export interface EntityExtractionResult {
  entities: Entity[];
  relations: EntityRelation[];
  context: EntityContext;
  confidence: number;
}

export interface EntityValidationResult {
  isValid: boolean;
  errors: string[];
  suggestions: string[];
}

export interface EntityNormalizationResult {
  original: string;
  normalized: string;
  confidence: number;
  source: string;
}

export interface EntityLinkingResult {
  entity: Entity;
  linkedEntities: Array<{
    id: string;
    name: string;
    type: string;
    confidence: number;
  }>;
}

export interface EntityClusteringResult {
  clusters: Array<{
    entities: Entity[];
    centroid: Entity;
    size: number;
    confidence: number;
  }>;
}

export interface EntityClassificationResult {
  entity: Entity;
  categories: Array<{
    name: string;
    confidence: number;
  }>;
}

export interface EntityResolutionResult {
  entity: Entity;
  resolvedEntities: Array<{
    id: string;
    name: string;
    type: string;
    confidence: number;
  }>;
}

export interface EntityEnrichmentResult {
  entity: Entity;
  enrichedData: Record<string, any>;
  confidence: number;
}

export interface EntityTrackingResult {
  entity: Entity;
  history: Array<{
    timestamp: number;
    state: Entity;
  }>;
}

export interface EntityAlignmentResult {
  source: Entity;
  target: Entity;
  alignment: {
    score: number;
    matches: Array<{
      source: string;
      target: string;
      confidence: number;
    }>;
  };
}

export interface EntityMergingResult {
  entities: Entity[];
  mergedEntity: Entity;
  confidence: number;
}

export interface EntitySplittingResult {
  originalEntity: Entity;
  splitEntities: Entity[];
  confidence: number;
}

export interface EntityValidationConfig {
  validateTypes: boolean;
  validateBoundaries: boolean;
  validateConfidence: boolean;
  minConfidence: number;
}

export interface EntityExtractionConfig {
  extractTypes: string[];
  minConfidence: number;
  maxEntities: number;
  includeContext: boolean;
}

export interface EntityLinkingConfig {
  linkTypes: string[];
  minConfidence: number;
  maxLinks: number;
  includeMetadata: boolean;
}

export interface EntityClusteringConfig {
  algorithm: string;
  minClusterSize: number;
  maxClusters: number;
  similarityThreshold: number;
}

export interface EntityClassificationConfig {
  categories: string[];
  minConfidence: number;
  maxCategories: number;
  includeHierarchy: boolean;
}

export interface EntityResolutionConfig {
  resolveTypes: string[];
  minConfidence: number;
  maxResolutions: number;
  includeContext: boolean;
}

export interface EntityEnrichmentConfig {
  enrichTypes: string[];
  minConfidence: number;
  maxEnrichments: number;
  includeMetadata: boolean;
}

export interface EntityTrackingConfig {
  trackTypes: string[];
  maxHistory: number;
  includeContext: boolean;
}

export interface EntityAlignmentConfig {
  alignTypes: string[];
  minConfidence: number;
  maxAlignments: number;
  includeContext: boolean;
}

export interface EntityMergingConfig {
  mergeTypes: string[];
  minConfidence: number;
  maxMerges: number;
  includeContext: boolean;
}

export interface EntitySplittingConfig {
  splitTypes: string[];
  minConfidence: number;
  maxSplits: number;
  includeContext: boolean;
}

export interface Relationship {
  source: Entity;
  target: Entity;
  type: string;
  confidence: number;
}

export class EntityRecognizer {
  private model: tf.LayersModel | null = null;
  private readonly logger = createLogger('EntityRecognizer');
  private isInitialized: boolean = false;
  private entityTypes: Set<string>;
  private relationshipTypes: Set<string>;

  constructor() {
    this.entityTypes = new Set(['PERSON', 'ORGANIZATION', 'LOCATION', 'DATE', 'TIME', 'MONEY', 'PERCENT']);
    this.relationshipTypes = new Set(['WORKS_FOR', 'LOCATED_IN', 'FOUNDED_BY', 'OWNS', 'PART_OF']);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.info('EntityRecognizer already initialized');
      return;
    }

    try {
      await this.loadModel();
      this.isInitialized = true;
      this.logger.info('EntityRecognizer initialized');
    } catch (error) {
      this.logger.error('Failed to initialize EntityRecognizer:', error);
      throw new Error('EntityRecognizer initialization failed');
    }
  }

  async recognize(text: string): Promise<Entity[]> {
    if (!this.isInitialized) {
      throw new Error('EntityRecognizer not initialized');
    }

    try {
      const entities: Entity[] = [];

      // Person names (capitalized words)
      const nameRegex = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
      let match;
      while ((match = nameRegex.exec(text)) !== null) {
        entities.push({
          text: match[0],
          type: 'PERSON',
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.8
        });
      }

      // Organizations (uppercase words)
      const orgRegex = /\b[A-Z][A-Z]+\b/g;
      while ((match = orgRegex.exec(text)) !== null) {
        entities.push({
          text: match[0],
          type: 'ORGANIZATION',
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.7
        });
      }

      // Dates
      const dateRegex = /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/g;
      while ((match = dateRegex.exec(text)) !== null) {
        entities.push({
          text: match[0],
          type: 'DATE',
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.9
        });
      }

      // Money
      const moneyRegex = /\$\d+(?:\.\d{2})?|\d+(?:\.\d{2})?\s*(?:USD|EUR|GBP)\b/g;
      while ((match = moneyRegex.exec(text)) !== null) {
        entities.push({
          text: match[0],
          type: 'MONEY',
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.95
        });
      }

      // Locations (capitalized words followed by location indicators)
      const locationRegex = /\b[A-Z][a-z]+(?:\s+(?:Street|Road|Avenue|City|State|Country|Lake|Mountain|River))\b/g;
      while ((match = locationRegex.exec(text)) !== null) {
        entities.push({
          text: match[0],
          type: 'LOCATION',
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.85
        });
      }

      return this.resolveOverlappingEntities(entities);
    } catch (error) {
      this.logger.error('Entity recognition failed:', error);
      throw new Error('Entity recognition failed');
    }
  }

  async extractRelationships(entities: Entity[]): Promise<Relationship[]> {
    if (!this.isInitialized) {
      throw new Error('EntityRecognizer not initialized');
    }

    try {
      const relationships: Relationship[] = [];

      // Find potential relationships between entities
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const source = entities[i];
          const target = entities[j];

          if (source.type === 'PERSON' && target.type === 'ORGANIZATION') {
            relationships.push({
              source,
              target,
              type: 'WORKS_FOR',
              confidence: 0.7
            });
          }

          if (source.type === 'ORGANIZATION' && target.type === 'LOCATION') {
            relationships.push({
              source,
              target,
              type: 'LOCATED_IN',
              confidence: 0.8
            });
          }

          if (source.type === 'PERSON' && target.type === 'ORGANIZATION') {
            relationships.push({
              source,
              target,
              type: 'FOUNDED_BY',
              confidence: 0.6
            });
          }
        }
      }

      return relationships;
    } catch (error) {
      this.logger.error('Relationship extraction failed:', error);
      throw new Error('Failed to extract relationships');
    }
  }

  async linkEntities(entities: Entity[], context: string): Promise<Entity[]> {
    if (!this.isInitialized) {
      throw new Error('EntityRecognizer not initialized');
    }

    try {
      // Enhance entities with context information
      return entities.map(entity => {
        const contextBefore = context.substring(Math.max(0, entity.start - 50), entity.start);
        const contextAfter = context.substring(entity.end, Math.min(context.length, entity.end + 50));

        // Adjust confidence based on context
        let confidenceBoost = 0;

        // Check for strong contextual indicators
        if (this.hasContextualIndicator(contextBefore, contextAfter, entity.type)) {
          confidenceBoost = 0.1;
        }

        return {
          ...entity,
          confidence: Math.min(1, entity.confidence + confidenceBoost)
        };
      });
    } catch (error) {
      this.logger.error('Entity linking failed:', error);
      throw new Error('Entity linking failed');
    }
  }

  private async loadModel(): Promise<void> {
    try {
      this.model = await tf.loadLayersModel('file://./models/ner/model.json');
      this.logger.info('NER model loaded');
    } catch (error) {
      this.logger.error('Failed to load NER model:', error);
      // Create a simple model for testing
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({ units: 64, activation: 'relu', inputShape: [100] }),
          tf.layers.dense({ units: 32, activation: 'relu' }),
          tf.layers.dense({ units: this.entityTypes.size, activation: 'softmax' })
        ]
      });
      this.model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy'] });
    }
  }

  private resolveOverlappingEntities(entities: Entity[]): Entity[] {
    // Sort entities by start position and confidence
    const sorted = [...entities].sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return b.confidence - a.confidence;
    });

    const result: Entity[] = [];
    let lastEnd = -1;

    for (const entity of sorted) {
      if (entity.start >= lastEnd) {
        result.push(entity);
        lastEnd = entity.end;
      }
    }

    return result;
  }

  private hasContextualIndicator(before: string, after: string, type: string): boolean {
    const context = (before + ' ' + after).toLowerCase();
    
    const indicators: { [key: string]: string[] } = {
      PERSON: ['mr', 'mrs', 'dr', 'prof', 'said', 'told'],
      ORGANIZATION: ['company', 'corp', 'inc', 'ltd', 'organization'],
      LOCATION: ['in', 'at', 'near', 'located'],
      DATE: ['on', 'during', 'after', 'before'],
      MONEY: ['cost', 'price', 'worth', 'valued']
    };

    return indicators[type]?.some(indicator => context.includes(indicator)) ?? false;
  }
} 