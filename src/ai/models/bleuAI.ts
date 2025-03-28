import * as tf from '@tensorflow/tfjs-node';
import { BleuConfig } from '../../types/config';
import { logger } from '../../utils/logger';
import { loadTokenizer } from '../utils/tokenizer';

export interface Tokenizer {
  encode(text: string): Promise<number[]>;
  decode(tokens: number[]): Promise<string>;
  vocabSize: number;
}

export class BleuAI {
  private model: tf.LayersModel | null = null;
  private tokenizer: Tokenizer | null = null;
  private config: BleuConfig;

  constructor(config: BleuConfig) {
    this.config = config;
  }

  public async initialize(): Promise<void> {
    try {
      // Load tokenizer
      this.tokenizer = await loadTokenizer(this.config.modelPath + '/tokenizer.json');
      
      // Load or create model
      try {
        this.model = await tf.loadLayersModel(`file://${this.config.modelPath}/model.json`);
        logger.info('Model loaded successfully');
      } catch (error) {
        logger.warn('Could not load existing model, creating new one', { error });
        this.model = this.createModel();
        await this.model.save(`file://${this.config.modelPath}`);
      }
    } catch (error) {
      logger.error('Failed to initialize BleuAI', { error });
      throw new Error('Failed to initialize BleuAI');
    }
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential();
    
    // Add layers based on configuration
    this.config.architecture.layers.forEach((units, index) => {
      if (index === 0) {
        model.add(tf.layers.dense({
          units,
          inputShape: [this.tokenizer!.vocabSize],
          activation: 'relu'
        }));
      } else {
        model.add(tf.layers.dense({ units, activation: 'relu' }));
      }
    });

    // Add output layer
    model.add(tf.layers.dense({
      units: this.tokenizer!.vocabSize,
      activation: 'softmax'
    }));

    // Compile model
    model.compile({
      optimizer: tf.train.adam(this.config.training.learningRate),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  public async process(text: string): Promise<string> {
    if (!this.model || !this.tokenizer) {
      throw new Error('Model not initialized');
    }

    try {
      // Encode input text
      const tokens = await this.tokenizer.encode(text);
      
      // Convert to tensor and make prediction
      const inputTensor = tf.tensor2d([tokens], [1, tokens.length]);
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      
      // Get the predicted tokens
      const predictedTokens = await prediction.argMax(-1).array() as number[];
      
      // Decode back to text
      const result = await this.tokenizer.decode(predictedTokens);

      // Cleanup
      inputTensor.dispose();
      prediction.dispose();

      return result;
    } catch (error) {
      logger.error('Error processing text', { error, text });
      throw new Error('Failed to process text');
    }
  }

  public async analyzeCode(code: string): Promise<any> {
    if (!this.model || !this.tokenizer) {
      throw new Error('Model not initialized');
    }

    try {
      // Encode input code
      const tokens = await this.tokenizer.encode(code);
      
      // Convert to tensor and make prediction
      const inputTensor = tf.tensor2d([tokens], [1, tokens.length]);
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      
      // Convert prediction to structured analysis
      const analysis = await this.parseCodeAnalysis(await prediction.data() as Float32Array);

      // Cleanup
      inputTensor.dispose();
      prediction.dispose();

      return analysis;
    } catch (error) {
      logger.error('Error analyzing code', { error, code });
      throw new Error('Failed to analyze code');
    }
  }

  private async parseCodeAnalysis(prediction: Float32Array): Promise<any> {
    // Implement your logic to convert model predictions into structured analysis
    // This is a placeholder implementation
    return {
      complexity: prediction[0],
      quality: prediction[1],
      maintainability: prediction[2],
      suggestions: []
    };
  }

  public async dispose(): Promise<void> {
    try {
      if (this.model) {
        this.model.dispose();
        this.model = null;
      }
      this.tokenizer = null;
    } catch (error) {
      logger.error('Error disposing model', { error });
      throw new Error('Failed to dispose model');
    }
  }
} 