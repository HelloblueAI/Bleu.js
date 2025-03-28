//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

import * as tf from '@tensorflow/tfjs-node';
import { EventEmitter } from 'events';
import { generateDNA } from '../utils/eggUtils';

interface EggProperties {
  power: number;
  durability: number;
  specialAbility: string;
}

interface EggMetadata {
  createdAt: Date;
  updatedAt: Date;
  version: string;
  tags: string[];
  origin: string;
  aiModel: string;
  age?: number;
}

interface Egg {
  id: string;
  type: string;
  description: string;
  element: string;
  rarity: string;
  properties: EggProperties;
  metadata: EggMetadata;
}

interface AIConfig {
  modelPath?: string;
  batchSize?: number;
  learningRate?: number;
  epochs?: number;
  validationSplit?: number;
}

interface TrainingHistory {
  epoch: number;
  loss: number;
  accuracy: number;
  mse: number;
  val_loss: number;
  val_accuracy: number;
  val_mse: number;
}

class EggGeneratorAI extends EventEmitter {
  private config: Required<AIConfig>;
  private model: tf.LayersModel | null;
  private isTraining: boolean;
  private trainingHistory: TrainingHistory[];

  constructor(config: AIConfig = {}) {
    super();
    this.config = {
      modelPath: config.modelPath || 'models/egg-generator',
      batchSize: config.batchSize || 32,
      learningRate: config.learningRate || 0.001,
      epochs: config.epochs || 100,
      validationSplit: config.validationSplit || 0.2,
    };
    this.model = null;
    this.isTraining = false;
    this.trainingHistory = [];
  }

  async initialize(): Promise<void> {
    try {
      this.model = await this.loadModel();
      if (!this.model) {
        this.model = this.createModel();
      }
      this.emit('initialized', { model: this.model });
    } catch (error) {
      this.emit('error', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential();

    model.add(tf.layers.dense({
      units: 128,
      activation: 'relu',
      inputShape: [10]
    }));

    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));

    model.add(tf.layers.dense({ units: 5, activation: 'softmax' }));
    model.add(tf.layers.dense({ units: 3, activation: 'sigmoid' }));

    model.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: ['categoricalCrossentropy', 'meanSquaredError'],
      metrics: ['accuracy', 'mse']
    });

    return model;
  }

  private async loadModel(): Promise<tf.LayersModel | null> {
    try {
      return await tf.loadLayersModel(`file://${this.config.modelPath}/model.json`);
    } catch (error) {
      console.warn('No existing model found, creating new one');
      return null;
    }
  }

  async train(trainingData: Egg[]): Promise<tf.History> {
    if (this.isTraining) {
      throw new Error('Model is already training');
    }

    this.isTraining = true;
    this.emit('training:start');

    try {
      const { features, labels } = this.preprocessData(trainingData);
      
      const history = await this.model!.fit(features, labels, {
        batchSize: this.config.batchSize,
        epochs: this.config.epochs,
        validationSplit: this.config.validationSplit,
        callbacks: {
          onEpochEnd: (epoch: number, logs: tf.Logs) => {
            this.trainingHistory.push({ epoch, ...logs as TrainingHistory });
            this.emit('training:epoch', { epoch, logs });
          }
        }
      });

      await this.model!.save(`file://${this.config.modelPath}`);
      this.emit('training:complete', { history });
      return history;
    } catch (error) {
      this.emit('error', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      this.isTraining = false;
    }
  }

  private preprocessData(data: Egg[]): { features: tf.Tensor2D; labels: tf.Tensor2D } {
    const features = tf.tensor2d(data.map(d => this.extractFeatures(d)));
    const labels = tf.tensor2d(data.map(d => this.extractLabels(d)));
    return { features, labels };
  }

  private extractFeatures(egg: Egg): number[] {
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

  private extractLabels(egg: Egg): number[] {
    const rarityOneHot = this.rarityToOneHot(egg.rarity);
    const properties = [
      egg.properties.power / 100,
      egg.properties.durability / 100,
      egg.properties.specialAbility ? 1 : 0
    ];
    return [...rarityOneHot, ...properties];
  }

  private rarityToOneHot(rarity: string): number[] {
    const rarityMap: Record<string, number[]> = {
      common: [1, 0, 0, 0, 0],
      uncommon: [0, 1, 0, 0, 0],
      rare: [0, 0, 1, 0, 0],
      legendary: [0, 0, 0, 1, 0],
      mythical: [0, 0, 0, 0, 1]
    };
    return rarityMap[rarity] || rarityMap.common;
  }

  async generateEgg(options: Partial<Egg> = {}): Promise<Egg> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    try {
      const inputFeatures = tf.randomUniform([1, 10]);
      const predictions = await this.model.predict(inputFeatures) as [tf.Tensor, tf.Tensor];
      const [rarityProbs, properties] = predictions;
      
      const rarity = this.oneHotToRarity(await rarityProbs.data() as Float32Array);
      const [power, durability, hasSpecialAbility] = await properties.data() as Float32Array;
      
      const egg: Egg = {
        id: generateDNA(),
        type: options.type || 'ai-generated',
        description: this.generateDescription(rarity, properties),
        element: await this.determineElement(rarity, properties),
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
          tags: await this.generateTags(rarity, properties),
          origin: 'ai-generated',
          aiModel: 'egg-generator-v2'
        }
      };

      this.emit('egg:generated', { egg });
      return egg;
    } catch (error) {
      this.emit('error', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  private oneHotToRarity(probs: Float32Array): string {
    const rarityMap = ['common', 'uncommon', 'rare', 'legendary', 'mythical'];
    const maxIndex = Array.from(probs).indexOf(Math.max(...probs));
    return rarityMap[maxIndex];
  }

  private generateDescription(rarity: string, properties: tf.Tensor): string {
    const adjectives: Record<string, string[]> = {
      common: ['ordinary', 'regular', 'standard'],
      uncommon: ['unusual', 'special', 'unique'],
      rare: ['rare', 'exquisite', 'precious'],
      legendary: ['legendary', 'mythical', 'extraordinary'],
      mythical: ['divine', 'celestial', 'transcendent']
    };

    const adjective = adjectives[rarity][Math.floor(Math.random() * adjectives[rarity].length)];
    return `An ${adjective} egg with mysterious properties.`;
  }

  private async determineElement(rarity: string, properties: tf.Tensor): Promise<string> {
    const elements = ['fire', 'water', 'earth', 'air', 'lightning', 'cosmic', 'void'];
    const weights = Array.from(await properties.data() as Float32Array).map(p => p * 100);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (let i = 0; i < weights.length; i++) {
      currentWeight += weights[i];
      if (random <= currentWeight) {
        return elements[i];
      }
    }
    
    return elements[elements.length - 1];
  }

  private generateSpecialAbility(): string {
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

  private async generateTags(rarity: string, properties: tf.Tensor): Promise<string[]> {
    const tags = new Set<string>();
    tags.add('ai-generated');
    tags.add(rarity);
    
    const props = Array.from(await properties.data() as Float32Array);
    if (props[0] > 0.8) tags.add('high-power');
    if (props[1] > 0.8) tags.add('high-durability');
    if (props[2] > 0.5) tags.add('special-ability');
    
    return Array.from(tags);
  }

  async evaluateModel(testData: Egg[]): Promise<tf.EvaluationResult> {
    const { features, labels } = this.preprocessData(testData);
    const evaluation = await this.model!.evaluate(features, labels);
    this.emit('evaluation:complete', { evaluation });
    return evaluation;
  }

  getTrainingHistory(): TrainingHistory[] {
    return this.trainingHistory;
  }
}

export default EggGeneratorAI; 