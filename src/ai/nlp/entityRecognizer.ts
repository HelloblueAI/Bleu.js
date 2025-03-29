import { createLogger } from '../../utils/logger';
import * as tf from '@tensorflow/tfjs-node';

export interface EntityRecognizerConfig {
  modelPath: string;
  vocabSize: number;
  maxSequenceLength: number;
}

export interface Entity {
  text: string;
  type: string;
  start: number;
  end: number;
}

export class EntityRecognizer {
  private logger = createLogger('EntityRecognizer');
  private model: tf.LayersModel | null = null;
  private config: Required<EntityRecognizerConfig>;
  private initialized = false;

  constructor(config: EntityRecognizerConfig) {
    this.config = {
      modelPath: config.modelPath,
      vocabSize: config.vocabSize,
      maxSequenceLength: config.maxSequenceLength
    };
  }

  async initialize(): Promise<void> {
    try {
      await this.createModel();
      this.initialized = true;
      this.logger.info('Entity recognizer initialized');
    } catch (error) {
      this.logger.error('Failed to initialize entity recognizer:', error);
      throw new Error('Failed to initialize entity recognizer');
    }
  }

  private async createModel(): Promise<void> {
    const model = tf.sequential();

    // Embedding layer
    model.add(tf.layers.embedding({
      inputDim: this.config.vocabSize,
      outputDim: 100,
      inputLength: this.config.maxSequenceLength
    }));

    // Bidirectional LSTM layer
    model.add(tf.layers.bidirectional({
      layer: tf.layers.lstm({ units: 128, returnSequences: true })
    }));

    // Dense layer with CRF
    model.add(tf.layers.dense({
      units: 128,
      activation: 'relu'
    }));

    model.add(tf.layers.dense({
      units: 9, // Number of entity types + 1 for non-entity
      activation: 'softmax'
    }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    this.model = model;
  }

  async recognize(text: string): Promise<Entity[]> {
    if (!this.initialized || !this.model) {
      throw new Error('Entity recognizer not initialized');
    }

    try {
      // Tokenize text
      const tokens = text.split(/\s+/);
      
      // Convert tokens to tensor
      const inputTensor = this.tokenizeToTensor(tokens);
      
      // Get predictions
      const predictions = await this.model.predict(inputTensor) as tf.Tensor;
      const predictionArray = await predictions.array();
      
      // Convert predictions to entities
      const entities = this.convertPredictionsToEntities(
        predictionArray[0],
        tokens
      );

      // Cleanup tensors
      tf.dispose([inputTensor, predictions]);

      return entities;
    } catch (error) {
      this.logger.error('Failed to recognize entities:', error);
      throw error;
    }
  }

  private tokenizeToTensor(tokens: string[]): tf.Tensor {
    // Simple tokenization for now - can be improved with proper tokenizer
    const tokenIds = tokens.map(token => this.getTokenId(token));
    
    // Pad or truncate to maxSequenceLength
    const paddedIds = this.padSequence(tokenIds, this.config.maxSequenceLength);
    
    return tf.tensor2d([paddedIds]);
  }

  private getTokenId(token: string): number {
    // Simple hash function for token IDs
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = ((hash << 5) - hash) + token.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % this.config.vocabSize;
  }

  private padSequence(sequence: number[], maxLength: number): number[] {
    if (sequence.length >= maxLength) {
      return sequence.slice(0, maxLength);
    }
    return [...sequence, ...Array(maxLength - sequence.length).fill(0)];
  }

  private convertPredictionsToEntities(
    predictions: number[],
    tokens: string[]
  ): Entity[] {
    const entities: Entity[] = [];
    let currentEntity: Entity | null = null;

    predictions.forEach((pred, index) => {
      if (index >= tokens.length) return;

      const entityType = this.getEntityType(pred);
      
      if (entityType === 'O') {
        if (currentEntity) {
          entities.push(currentEntity);
          currentEntity = null;
        }
      } else if (currentEntity && currentEntity.type === entityType) {
        currentEntity.text += ' ' + tokens[index];
        currentEntity.end = index;
      } else {
        if (currentEntity) {
          entities.push(currentEntity);
        }
        currentEntity = {
          text: tokens[index],
          type: entityType,
          start: index,
          end: index
        };
      }
    });

    if (currentEntity) {
      entities.push(currentEntity);
    }

    return entities;
  }

  private getEntityType(prediction: number): string {
    const entityTypes = [
      'O',      // Non-entity
      'PER',    // Person
      'ORG',    // Organization
      'LOC',    // Location
      'TIME',   // Time
      'MONEY',  // Money
      'QUANTITY', // Quantity
      'ORDINAL', // Ordinal
      'OTHER'   // Other
    ];
    return entityTypes[Math.floor(prediction * entityTypes.length)];
  }

  async train(
    texts: string[],
    labels: Array<Array<{ type: string; start: number; end: number }>>
  ): Promise<void> {
    if (!this.initialized || !this.model) {
      throw new Error('Entity recognizer not initialized');
    }

    try {
      // Prepare training data
      const trainingData = await Promise.all(
        texts.map(text => this.tokenizeToTensor(text.split(/\s+/)))
      );
      const trainingLabels = this.prepareLabels(labels);

      // Train model
      await this.model.fit(
        tf.concat(trainingData, 0),
        tf.concat(trainingLabels, 0),
        {
          epochs: 10,
          batchSize: 32,
          validationSplit: 0.2,
          callbacks: {
            onEpochEnd: (epoch, logs) => {
              this.logger.info(`Epoch ${epoch + 1} completed:`, logs);
            }
          }
        }
      );

      // Cleanup tensors
      tf.dispose([...trainingData, ...trainingLabels]);

      this.logger.info('Entity recognizer training completed');
    } catch (error) {
      this.logger.error('Failed to train entity recognizer:', error);
      throw error;
    }
  }

  private prepareLabels(
    labels: Array<Array<{ type: string; start: number; end: number }>>
  ): tf.Tensor[] {
    return labels.map(labelSet => {
      const labelArray = new Array(this.config.maxSequenceLength).fill(0);
      labelSet.forEach(label => {
        for (let i = label.start; i <= label.end; i++) {
          labelArray[i] = this.getEntityTypeId(label.type);
        }
      });
      return tf.tensor2d([labelArray]);
    });
  }

  private getEntityTypeId(type: string): number {
    const entityTypes = ['O', 'PER', 'ORG', 'LOC', 'TIME', 'MONEY', 'QUANTITY', 'ORDINAL', 'OTHER'];
    return entityTypes.indexOf(type);
  }

  async save(): Promise<void> {
    if (!this.initialized || !this.model) {
      throw new Error('Entity recognizer not initialized');
    }

    try {
      await this.model.save(`file://${this.config.modelPath}`);
      this.logger.info('Entity recognizer model saved');
    } catch (error) {
      this.logger.error('Failed to save entity recognizer model:', error);
      throw error;
    }
  }

  async load(): Promise<void> {
    try {
      this.model = await tf.loadLayersModel(`file://${this.config.modelPath}/model.json`);
      this.initialized = true;
      this.logger.info('Entity recognizer model loaded');
    } catch (error) {
      this.logger.error('Failed to load entity recognizer model:', error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.initialized = false;
  }
} 