//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.

import { Egg, EggEvents, cache, metrics } from '../models/egg.model.js';
import { OpenAI } from 'openai';
import { createHash } from 'crypto';

import winston from 'winston';
import cluster from 'cluster';
import { Worker } from 'worker_threads';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.metadata(),
    winston.format.json(),
  ),
  defaultMeta: {
    service: 'egg-service',
    version: process.env.SERVICE_VERSION || '1.0.37',
    environment: process.env.NODE_ENV,
  },
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.Console({
      format: winston.format.simple(),
      silent: process.env.NODE_ENV === 'test',
    }),
  ],
});

class EggService {
  constructor(config = {}) {
    this.config = {
      aiEnabled: true,
      useMLPredictions: true,
      enableRealTimeUpdates: true,
      maxWorkers: Math.max(2, config.maxWorkers || 4), // Ensure at least 2 workers
      cacheTTL: config.cacheTTL || 3600, // Default 1-hour cache
      ...config,
    };

    this.workerPool = new Set();
    this.initialize();
  }

  async initialize() {
    if (cluster.isPrimary) {
      for (let i = 0; i < this.config.maxWorkers; i++) {
        this._spawnWorker();
      }
    }
    this.setupEventHandlers();
  }

  _spawnWorker() {
    const worker = new Worker(path.join(__dirname, 'egg.worker.js'));
    this.workerPool.add(worker);

    worker.on('exit', (code) => {
      logger.warn(`Worker exited with code ${code}. Restarting...`);
      this.workerPool.delete(worker);
      this._spawnWorker(); // Auto-restart worker
    });
  }

  setupEventHandlers() {
    EggEvents.on('eggCreated', this.handleEggCreated.bind(this));
    EggEvents.on('eggEvolved', this.handleEggEvolved.bind(this));
    EggEvents.on('eggExpired', this.handleEggExpired.bind(this));
  }

  async generateNewEgg(options, correlationId) {
    const startTime = performance.now();
    logger.info('Starting egg generation', { correlationId, options });

    try {
      const cacheKey = this._generateCacheKey(options);
      if (await cache.exists(cacheKey)) {
        metrics.cacheHits++;
        return await cache.get(cacheKey);
      }

      metrics.cacheMisses++;
      const baseEgg = await this._generateBaseEgg(options);

      if (this.config.aiEnabled) {
        await this._enhanceWithAI(baseEgg);
      }

      const eggDoc = new Egg(baseEgg);
      await eggDoc.save();
      await cache.set(cacheKey, baseEgg, this.config.cacheTTL);

      const duration = performance.now() - startTime;
      metrics.eggGeneration.set(baseEgg.id, duration);

      logger.info('Egg generation completed', {
        correlationId,
        eggId: baseEgg.id,
        duration,
      });

      return baseEgg;
    } catch (error) {
      logger.error('Error generating egg', {
        correlationId,
        error: error.message,
        stack: error.stack,
        options,
      });
      throw error;
    }
  }

  async _generateBaseEgg(options) {
    return {
      id: createHash('sha256').update(Date.now().toString()).digest('hex'),
      type: options.type || 'common',
      description:
        options.description || 'A mysterious egg with unknown properties.',
      metadata: {
        ...options.metadata,
        generatedBy: 'EggService v1.0.37',
        rarity: this._calculateRarity(options),
        timestamp: new Date().toISOString(),
      },
      status: 'incubating',
    };
  }

  async _enhanceWithAI(egg) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Enhance the following egg description with magical and mystical elements: ${egg.description}`,
          },
        ],
      });

      if (completion.choices?.[0]?.message?.content) {
        egg.description = completion.choices[0].message.content;
      } else {
        logger.warn('AI response was empty, keeping original description.');
      }
    } catch (error) {
      logger.warn('AI enhancement failed, using original description', {
        error: error.message,
      });
    }
  }

  _calculateRarity(options) {
    const rarityProbabilities = {
      common: 65,
      uncommon: 20,
      rare: 10,
      legendary: 3,
      mythical: 1,
      divine: 0.5,
      unique: 0.1,
    };

    const random = Math.random() * 100;
    let cumulativeProbability = 0;

    for (const [rarity, probability] of Object.entries(rarityProbabilities)) {
      cumulativeProbability += probability;
      if (random <= cumulativeProbability) {
        return rarity;
      }
    }

    return 'common';
  }

  handleEggCreated(egg) {
    logger.info('New egg created', {
      eggId: egg.id,
      type: egg.type,
      rarity: egg.metadata.rarity,
    });
  }

  handleEggEvolved(egg) {
    logger.info('Egg evolved', {
      eggId: egg.id,
      newStatus: egg.status,
    });
  }

  handleEggExpired(egg) {
    logger.info('Egg expired', {
      eggId: egg.id,
      type: egg.type,
    });
  }

  _generateCacheKey(options) {
    return `egg:${createHash('sha256').update(JSON.stringify(options)).digest('hex')}`;
  }
}

export default EggService;
