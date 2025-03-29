import { createLogger } from '../../utils/logger';
import * as tf from '@tensorflow/tfjs-node';

export interface AnalyzerConfig {
  modelPath: string;
  vocabSize: number;
  maxSequenceLength: number;
  embeddingDim: number;
}

export class TextAnalyzer {
  private readonly config: AnalyzerConfig;
  private model: tf.LayersModel | null = null;
  private readonly logger = createLogger('TextAnalyzer');

  constructor(config: AnalyzerConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      this.model = this.createModel();
      this.logger.info('Text analyzer initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize text analyzer:', error);
      throw error;
    }
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential();

    // Embedding layer
    model.add(tf.layers.embedding({
      inputDim: this.config.vocabSize,
      outputDim: this.config.embeddingDim,
      inputLength: this.config.maxSequenceLength
    }));

    // Bidirectional LSTM for context understanding
    model.add(tf.layers.bidirectional({
      layer: tf.layers.lstm({
        units: 128,
        returnSequences: true
      })
    }));

    // Self-attention mechanism
    model.add(tf.layers.dense({
      units: 64,
      activation: 'tanh'
    }));

    // Global pooling
    model.add(tf.layers.globalAveragePooling1d());

    // Output layer
    model.add(tf.layers.dense({
      units: this.config.vocabSize,
      activation: 'softmax'
    }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  async analyze(text: string): Promise<{
    tokens: string[];
    embeddings: number[][];
    attention: number[];
  }> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    try {
      // Tokenize text
      const tokens = text.toLowerCase().split(/\s+/);
      
      // Convert to tensor
      const input = tf.tensor2d([tokens.map(t => this.getTokenId(t))]);
      
      // Get embeddings
      const embeddings = await this.model.predict(input) as tf.Tensor;
      const embeddingValues = await embeddings.array() as number[][];
      
      // Calculate attention weights
      const attention = await this.calculateAttention(embeddingValues[0]);
      
      // Cleanup
      input.dispose();
      embeddings.dispose();
      
      return {
        tokens,
        embeddings: embeddingValues,
        attention
      };
    } catch (error) {
      this.logger.error('Failed to analyze text:', error);
      throw error;
    }
  }

  private getTokenId(token: string): number {
    // Simple hash function for demo
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = ((hash << 5) - hash) + token.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % this.config.vocabSize;
  }

  private async calculateAttention(embeddings: number[]): Promise<number[]> {
    const attention = tf.tidy(() => {
      const emb = tf.tensor2d([embeddings]);
      const scores = tf.matMul(emb, emb, false, true);
      return tf.softmax(scores).dataSync();
    });
    return Array.from(attention);
  }

  async dispose(): Promise<void> {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
} 