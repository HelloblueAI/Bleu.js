import * as tf from '@tensorflow/tfjs-node';
import { BleuAI } from '../ai/bleuAI.js';
import { BleuConfig } from '../types/index.js';
import { createLogger } from '../utils/logger.js';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('TrainScript');

async function loadTrainingData(dataPath: string): Promise<{ inputs: tf.Tensor; labels: tf.Tensor }> {
  try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    // Convert text data to tensors
    const inputs = tf.tensor2d(data.inputs);
    const labels = tf.tensor2d(data.labels);
    
    return { inputs, labels };
  } catch (error) {
    logger.error('Error loading training data:', error);
    throw error;
  }
}

async function main() {
  try {
    // Load configuration
    const config: BleuConfig = {
      apiKey: process.env.BLEU_API_KEY || '',
      version: '1.1.3',
      model: {
        path: path.join(__dirname, '../../models'),
        architecture: {
          type: 'transformer',
          layers: 24,
          attentionHeads: 16,
          hiddenSize: 4096,
          vocabularySize: 50000,
          maxSequenceLength: 8192
        },
        training: {
          batchSize: 32,
          learningRate: 1e-4,
          epochs: 10,
          warmupSteps: 1000
        },
        inference: {
          defaultMaxTokens: 2048,
          defaultTemperature: 0.7,
          defaultTopP: 0.9
        }
      },
      security: {
        encryption: true,
        rateLimit: true,
        maxRequestsPerMinute: 60
      },
      monitoring: {
        enabled: true,
        metrics: ['accuracy', 'loss', 'latency']
      },
      deployment: {
        environment: 'production',
        region: 'us-east-1'
      },
      performance: {
        batchSize: 32,
        maxConcurrentRequests: 10,
        cacheEnabled: true
      }
    };

    // Initialize BleuAI
    const bleuAI = new BleuAI(config);
    await bleuAI.initialize();

    // Load training data
    const trainingData = await loadTrainingData(path.join(__dirname, '../../data/training.json'));

    // Train the model with advanced features
    logger.info('Starting model training with advanced features...');
    await bleuAI.train({
      data: trainingData,
      epochs: config.model.training.epochs,
      batchSize: config.model.training.batchSize,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          logger.info(`Epoch ${epoch + 1} completed. Loss: ${logs?.loss.toFixed(4)}`);
        }
      }
    });

    // Save the trained model
    await bleuAI.save(path.join(config.model.path, 'trained-model'));

    logger.info('Training completed successfully. Model saved and ready for deployment.');
  } catch (error) {
    logger.error('Training failed:', error);
    process.exit(1);
  }
}

main(); 