import * as fs from 'fs';
import * as path from 'path';

export interface ModelConfig {
  architecture: {
    type: string;
    layers: number;
    attentionHeads: number;
    hiddenSize: number;
    vocabularySize: number;
    maxSequenceLength: number;
  };
  training: {
    batchSize: number;
    learningRate: number;
    epochs: number;
    warmupSteps: number;
  };
  inference: {
    defaultMaxTokens: number;
    defaultTemperature: number;
    defaultTopP: number;
  };
}

export async function loadModelConfig(configPath: string): Promise<ModelConfig> {
  try {
    const config = JSON.parse(await fs.promises.readFile(configPath, 'utf-8'));
    validateConfig(config);
    return config;
  } catch (error) {
    console.error('Error loading model config:', error);
    throw error;
  }
}

function validateConfig(config: any): asserts config is ModelConfig {
  const required = [
    'architecture',
    'training',
    'inference'
  ];

  const architectureRequired = [
    'type',
    'layers',
    'attentionHeads',
    'hiddenSize',
    'vocabularySize',
    'maxSequenceLength'
  ];

  const trainingRequired = [
    'batchSize',
    'learningRate',
    'epochs',
    'warmupSteps'
  ];

  const inferenceRequired = [
    'defaultMaxTokens',
    'defaultTemperature',
    'defaultTopP'
  ];

  // Check top-level keys
  for (const key of required) {
    if (!(key in config)) {
      throw new Error(`Missing required config key: ${key}`);
    }
  }

  // Check architecture keys
  for (const key of architectureRequired) {
    if (!(key in config.architecture)) {
      throw new Error(`Missing required architecture config key: ${key}`);
    }
  }

  // Check training keys
  for (const key of trainingRequired) {
    if (!(key in config.training)) {
      throw new Error(`Missing required training config key: ${key}`);
    }
  }

  // Check inference keys
  for (const key of inferenceRequired) {
    if (!(key in config.inference)) {
      throw new Error(`Missing required inference config key: ${key}`);
    }
  }

  // Validate value ranges
  if (config.architecture.layers <= 0) {
    throw new Error('Number of layers must be positive');
  }

  if (config.architecture.attentionHeads <= 0) {
    throw new Error('Number of attention heads must be positive');
  }

  if (config.architecture.hiddenSize <= 0) {
    throw new Error('Hidden size must be positive');
  }

  if (config.architecture.vocabularySize <= 0) {
    throw new Error('Vocabulary size must be positive');
  }

  if (config.architecture.maxSequenceLength <= 0) {
    throw new Error('Max sequence length must be positive');
  }

  if (config.training.batchSize <= 0) {
    throw new Error('Batch size must be positive');
  }

  if (config.training.learningRate <= 0) {
    throw new Error('Learning rate must be positive');
  }

  if (config.training.epochs <= 0) {
    throw new Error('Number of epochs must be positive');
  }

  if (config.inference.defaultTemperature <= 0 || config.inference.defaultTemperature > 2) {
    throw new Error('Temperature must be between 0 and 2');
  }

  if (config.inference.defaultTopP <= 0 || config.inference.defaultTopP > 1) {
    throw new Error('Top-p must be between 0 and 1');
  }
} 