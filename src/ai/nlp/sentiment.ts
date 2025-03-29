import { createLogger } from '../../utils/logger';
import * as tf from '@tensorflow/tfjs-node';

export interface SentimentResult {
  score: number;
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions?: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
  };
}

export class SentimentAnalyzer {
  private model: tf.LayersModel | null = null;
  private emotionModel: tf.LayersModel | null = null;
  private logger = createLogger('SentimentAnalyzer');
  private isInitialized: boolean = false;
  private vocabulary: Map<string, number>;

  constructor() {
    this.vocabulary = new Map();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.info('SentimentAnalyzer already initialized');
      return;
    }

    try {
      await Promise.all([
        this.loadModel(),
        this.loadEmotionModel(),
        this.loadVocabulary()
      ]);
      this.isInitialized = true;
      this.logger.info('SentimentAnalyzer initialized');
    } catch (error) {
      this.logger.error('Failed to initialize SentimentAnalyzer:', error);
      throw new Error('SentimentAnalyzer initialization failed');
    }
  }

  async analyze(text: string): Promise<SentimentResult> {
    if (!this.isInitialized) {
      throw new Error('SentimentAnalyzer not initialized');
    }

    try {
      const [sentimentScore, emotions] = await Promise.all([
        this.predictSentiment(text),
        this.detectEmotions(text)
      ]);

      const result: SentimentResult = {
        score: sentimentScore,
        label: this.getLabel(sentimentScore),
        confidence: this.calculateConfidence(sentimentScore),
        emotions
      };

      return result;
    } catch (error) {
      this.logger.error('Sentiment analysis failed:', error);
      throw new Error('Sentiment analysis failed');
    }
  }

  async detectEmotions(text: string): Promise<{ joy: number; sadness: number; anger: number; fear: number; surprise: number }> {
    if (!this.isInitialized || !this.emotionModel) {
      throw new Error('Emotion detection not initialized');
    }

    try {
      const embedding = await this.createEmbedding(text);
      const prediction = await this.emotionModel.predict(embedding) as tf.Tensor;
      const emotions = await prediction.data();

      // Cleanup tensors
      embedding.dispose();
      prediction.dispose();

      return {
        joy: emotions[0],
        sadness: emotions[1],
        anger: emotions[2],
        fear: emotions[3],
        surprise: emotions[4]
      };
    } catch (error) {
      this.logger.error('Emotion detection failed:', error);
      throw new Error('Emotion detection failed');
    }
  }

  private async predictSentiment(text: string): Promise<number> {
    if (!this.model) {
      throw new Error('Sentiment model not initialized');
    }

    const embedding = await this.createEmbedding(text);
    const prediction = await this.model.predict(embedding) as tf.Tensor;
    const score = (await prediction.data())[0];

    // Cleanup tensors
    embedding.dispose();
    prediction.dispose();

    return score;
  }

  private async createEmbedding(text: string): Promise<tf.Tensor> {
    const tokens = text.toLowerCase().split(/\s+/);
    const embedding = new Float32Array(100).fill(0);

    tokens.forEach((token, i) => {
      if (i < 100) {
        embedding[i] = this.vocabulary.get(token) || 0;
      }
    });

    return tf.tensor2d([embedding]);
  }

  private getLabel(score: number): 'positive' | 'negative' | 'neutral' {
    if (score > 0.6) return 'positive';
    if (score < 0.4) return 'negative';
    return 'neutral';
  }

  private calculateConfidence(score: number): number {
    return Math.min(Math.abs(score - 0.5) * 2, 1);
  }

  private async loadModel(): Promise<void> {
    try {
      this.model = await tf.loadLayersModel('file://./models/sentiment/model.json');
      this.logger.info('Sentiment model loaded');
    } catch (error) {
      this.logger.error('Failed to load sentiment model:', error);
      // Create a simple model for testing
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({ units: 64, activation: 'relu', inputShape: [100] }),
          tf.layers.dense({ units: 32, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'sigmoid' })
        ]
      });
      this.model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy', metrics: ['accuracy'] });
    }
  }

  private async loadEmotionModel(): Promise<void> {
    try {
      this.emotionModel = await tf.loadLayersModel('file://./models/emotions/model.json');
      this.logger.info('Emotion model loaded');
    } catch (error) {
      this.logger.error('Failed to load emotion model:', error);
      // Create a simple model for testing
      this.emotionModel = tf.sequential({
        layers: [
          tf.layers.dense({ units: 64, activation: 'relu', inputShape: [100] }),
          tf.layers.dense({ units: 32, activation: 'relu' }),
          tf.layers.dense({ units: 5, activation: 'softmax' })
        ]
      });
      this.emotionModel.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy'] });
    }
  }

  private async loadVocabulary(): Promise<void> {
    // In a real implementation, load from a file or service
    const commonWords = ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
      'good', 'bad', 'happy', 'sad', 'angry', 'excited', 'terrible', 'great', 'awesome', 'horrible'];
    
    commonWords.forEach((word, index) => {
      this.vocabulary.set(word, (index + 1) / commonWords.length);
    });
  }
} 