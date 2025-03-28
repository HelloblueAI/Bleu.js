//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

import * as tf from '@tensorflow/tfjs-node';
import { EventEmitter } from 'events';
import { generateDNA } from '../utils/eggUtils.js';

class EggGeneratorAI extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      modelPath: config.modelPath || 'models/egg-generator',
      batchSize: config.batchSize || 32,
      learningRate: config.learningRate || 0.001,
      epochs: config.epochs || 100,
      validationSplit: config.validationSplit || 0.2,
      ...config
    };
    this.model = null;
    this.isTraining = false;
    this.trainingHistory = [];
  }

  async initialize() {
    try {
      // Load or create model
      this.model = await this.loadModel();
      if (!this.model) {
        this.model = this.createModel();
      }
      this.emit('initialized', { model: this.model });
    } catch (error) {
      this.emit('error', { error: error.message });
      throw error;
    }
  }

  createModel() {
    const model = tf.sequential();

    // Input layer for egg properties
    model.add(tf.layers.dense({
      units: 128,
      activation: 'relu',
      inputShape: [10]
    }));

    // Hidden layers with dropout for regularization
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));

    // Output layers for different egg properties
    model.add(tf.layers.dense({ units: 5, activation: 'softmax' })); // Rarity
    model.add(tf.layers.dense({ units: 3, activation: 'sigmoid' })); // Power, Durability, Special Ability

    // Compile model with custom optimizer and metrics
    model.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: ['categoricalCrossentropy', 'meanSquaredError'],
      metrics: ['accuracy', 'mse']
    });

    return model;
  }

  async loadModel() {
    try {
      return await tf.loadLayersModel(`file://${this.config.modelPath}/model.json`);
    } catch (error) {
      console.warn('No existing model found, creating new one');
      return null;
    }
  }

  async train(trainingData) {
    if (this.isTraining) {
      throw new Error('Model is already training');
    }

    this.isTraining = true;
    this.emit('training:start');

    try {
      const { features, labels } = this.preprocessData(trainingData);
      
      const history = await this.model.fit(features, labels, {
        batchSize: this.config.batchSize,
        epochs: this.config.epochs,
        validationSplit: this.config.validationSplit,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            this.trainingHistory.push({ epoch, ...logs });
            this.emit('training:epoch', { epoch, logs });
          }
        }
      });

      await this.model.save(`file://${this.config.modelPath}`);
      this.emit('training:complete', { history });
      return history;
    } catch (error) {
      this.emit('error', { error: error.message });
      throw error;
    } finally {
      this.isTraining = false;
    }
  }

  preprocessData(data) {
    // Convert raw data to tensors
    const features = tf.tensor2d(data.map(d => this.extractFeatures(d)));
    const labels = tf.tensor2d(data.map(d => this.extractLabels(d)));
    return { features, labels };
  }

  extractFeatures(egg) {
    // Extract numerical features from egg data
    return [
      egg.properties.power / 100,
      egg.properties.durability / 100,
      egg.metadata.age || 0,
      egg.metadata.version ? parseFloat(egg.metadata.version) : 0,
      egg.metadata.tags.length / 10,
      egg.metadata.origin === 'mystical' ? 1 : 0,
      egg.metadata.origin === 'celestial' ? 1 : 0,
      egg.metadata.origin === 'infernal' ? 1 : 0,
      egg.metadata.origin === 'abyssal' ? 1 : 0,
      egg.metadata.origin === 'cosmic' ? 1 : 0
    ];
  }

  extractLabels(egg) {
    // Convert egg properties to training labels
    const rarityOneHot = this.rarityToOneHot(egg.rarity);
    const properties = [
      egg.properties.power / 100,
      egg.properties.durability / 100,
      egg.properties.specialAbility ? 1 : 0
    ];
    return [...rarityOneHot, ...properties];
  }

  rarityToOneHot(rarity) {
    const rarityMap = {
      common: [1, 0, 0, 0, 0],
      uncommon: [0, 1, 0, 0, 0],
      rare: [0, 0, 1, 0, 0],
      legendary: [0, 0, 0, 1, 0],
      mythical: [0, 0, 0, 0, 1]
    };
    return rarityMap[rarity] || rarityMap.common;
  }

  async generateEgg(options = {}) {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    try {
      // Generate random input features
      const inputFeatures = tf.randomUniform([1, 10]);
      
      // Get model predictions
      const predictions = await this.model.predict(inputFeatures);
      const [rarityProbs, properties] = predictions;
      
      // Convert predictions to egg properties
      const rarity = this.oneHotToRarity(await rarityProbs.data());
      const [power, durability, hasSpecialAbility] = await properties.data();
      
      // Create egg with AI-generated properties
      const egg = {
        id: generateDNA(),
        type: options.type || 'ai-generated',
        description: this.generateDescription(rarity, properties),
        element: this.determineElement(rarity, properties),
        rarity,
        properties: {
          power: Math.floor(power * 100),
          durability: Math.floor(durability * 100),
          specialAbility: hasSpecialAbility > 0.5 ? this.generateSpecialAbility() : 'none'
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '2.0.0',
          tags: this.generateTags(rarity, properties),
          origin: 'ai-generated',
          aiModel: 'egg-generator-v2'
        }
      };

      this.emit('egg:generated', { egg });
      return egg;
    } catch (error) {
      this.emit('error', { error: error.message });
      throw error;
    }
  }

  oneHotToRarity(probs) {
    const rarityMap = ['common', 'uncommon', 'rare', 'legendary', 'mythical'];
    const maxIndex = probs.indexOf(Math.max(...probs));
    return rarityMap[maxIndex];
  }

  generateDescription(rarity, properties) {
    const adjectives = {
      common: ['ordinary', 'regular', 'standard'],
      uncommon: ['unusual', 'special', 'unique'],
      rare: ['rare', 'exquisite', 'precious'],
      legendary: ['legendary', 'mythical', 'extraordinary'],
      mythical: ['divine', 'celestial', 'transcendent']
    };

    const adjective = adjectives[rarity][Math.floor(Math.random() * adjectives[rarity].length)];
    return `An ${adjective} egg with mysterious properties.`;
  }

  determineElement(rarity, properties) {
    const elements = ['fire', 'water', 'earth', 'air', 'lightning', 'cosmic', 'void'];
    const weights = properties.map(p => p * 100);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const random = Math.random() * totalWeight;
    
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (random <= sum) {
        return elements[i % elements.length];
      }
    }
    return elements[0];
  }

  generateSpecialAbility() {
    const abilities = [
      'time manipulation',
      'elemental mastery',
      'healing',
      'invisibility',
      'teleportation',
      'mind control',
      'reality warping'
    ];
    return abilities[Math.floor(Math.random() * abilities.length)];
  }

  generateTags(rarity, properties) {
    const tags = new Set(['ai-generated']);
    tags.add(rarity);
    
    if (properties[0] > 0.8) tags.add('high-power');
    if (properties[1] > 0.8) tags.add('high-durability');
    if (properties[2] > 0.5) tags.add('special-ability');
    
    return Array.from(tags);
  }

  async evaluateModel(testData) {
    const { features, labels } = this.preprocessData(testData);
    const evaluation = await this.model.evaluate(features, labels);
    this.emit('evaluation:complete', { evaluation });
    return evaluation;
  }

  getTrainingHistory() {
    return this.trainingHistory;
  }
}

export default EggGeneratorAI; 