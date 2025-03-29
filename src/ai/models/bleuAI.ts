import * as tf from '@tensorflow/tfjs-node';
import { BleuConfig } from '../../types/config';
import { logger } from '../../utils/logger';
import { loadTokenizer } from '../utils/tokenizer';
import * as fs from 'fs';
import * as path from 'path';

export interface Tokenizer {
  encode(text: string): Promise<number[]>;
  decode(tokens: number[]): Promise<string>;
  vocabSize: number;
}

export class BleuAI {
  private model: tf.LayersModel | null = null;
  private tokenizer: Tokenizer | null = null;
  private config: BleuConfig;
  private initialized = false;

  constructor(config: BleuConfig) {
    this.config = {
      modelPath: config.modelPath || './models',
      architecture: {
        layers: config.architecture?.layers || [256, 128, 64]
      },
      training: {
        learningRate: config.training?.learningRate || 0.001,
        epochs: config.training?.epochs || 10,
        batchSize: config.training?.batchSize || 32
      },
      ...config
    };
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      logger.info('BleuAI already initialized');
      return;
    }

    try {
      // Ensure model directory exists
      if (!fs.existsSync(this.config.modelPath)) {
        fs.mkdirSync(this.config.modelPath, { recursive: true });
      }

      // Load or create tokenizer
      const tokenizerPath = path.join(this.config.modelPath, 'tokenizer.json');
      if (fs.existsSync(tokenizerPath)) {
        this.tokenizer = await loadTokenizer(tokenizerPath);
        logger.info('Tokenizer loaded successfully');
      } else {
        // Create a basic tokenizer if none exists
        this.tokenizer = {
          encode: async (text: string) => text.split('').map(c => c.charCodeAt(0)),
          decode: async (tokens: number[]) => String.fromCharCode(...tokens),
          vocabSize: 256
        };
        logger.info('Created basic tokenizer');
      }
      
      // Load or create model
      const modelPath = path.join(this.config.modelPath, 'model.json');
      if (fs.existsSync(modelPath)) {
        this.model = await tf.loadLayersModel(`file://${modelPath}`);
        logger.info('Model loaded successfully');
      } else {
        logger.info('Creating new model');
        this.model = this.createModel();
        await this.model.save(`file://${modelPath}`);
        logger.info('New model created and saved');
      }

      this.initialized = true;
      logger.info('BleuAI initialized successfully');
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
    if (!this.initialized) {
      await this.initialize();
    }

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

  public async train(texts: string[], labels: number[]): Promise<tf.History> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.model || !this.tokenizer) {
      throw new Error('Model not initialized');
    }

    try {
      // Convert texts to tensors
      const encodedTexts = await Promise.all(texts.map(text => this.tokenizer!.encode(text)));
      const inputTensor = tf.tensor2d(encodedTexts);
      const labelTensor = tf.tensor1d(labels);

      // Train the model
      const history = await this.model.fit(inputTensor, labelTensor, {
        epochs: this.config.training.epochs,
        batchSize: this.config.training.batchSize,
        validationSplit: 0.2
      });

      // Cleanup
      inputTensor.dispose();
      labelTensor.dispose();

      return history;
    } catch (error) {
      logger.error('Error training model', { error });
      throw new Error('Failed to train model');
    }
  }

  public async evaluate(texts: string[], labels: number[]): Promise<{
    accuracy: number;
    loss: number;
    precision: number;
    recall: number;
    f1Score: number;
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.model || !this.tokenizer) {
      throw new Error('Model not initialized');
    }

    try {
      // Convert texts to tensors
      const encodedTexts = await Promise.all(texts.map(text => this.tokenizer!.encode(text)));
      const inputTensor = tf.tensor2d(encodedTexts);
      const labelTensor = tf.tensor1d(labels);

      // Evaluate the model
      const result = await this.model.evaluate(inputTensor, labelTensor) as tf.Tensor[];
      const [loss, accuracy] = await Promise.all(result.map(t => t.data()));

      // Cleanup
      inputTensor.dispose();
      labelTensor.dispose();
      result.forEach(t => t.dispose());

      return {
        accuracy: accuracy[0],
        loss: loss[0],
        precision: 0.8, // Placeholder
        recall: 0.8, // Placeholder
        f1Score: 0.8 // Placeholder
      };
    } catch (error) {
      logger.error('Error evaluating model', { error });
      throw new Error('Failed to evaluate model');
    }
  }

  public async analyzeCode(code: string): Promise<any> {
    if (!this.initialized) {
      await this.initialize();
    }

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
    return {
      complexity: prediction[0],
      quality: prediction[1],
      maintainability: prediction[2],
      sentiment: prediction[3],
      confidence: prediction[4],
      entities: [],
      keywords: [],
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
      this.initialized = false;
      logger.info('BleuAI disposed successfully');
    } catch (error) {
      logger.error('Error disposing model', { error });
      throw new Error('Failed to dispose model');
    }
  }
} 