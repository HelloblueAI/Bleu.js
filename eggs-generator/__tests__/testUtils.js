import request from 'supertest';

export const DEFAULT_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json'
};

export const VALID_EGG_TYPES = ['dragon', 'phoenix', 'basilisk'];

export const createMockEgg = (type = 'dragon') => ({
  id: 'TEST-EGG-001',
  type,
  description: 'A rare dragon egg',
  metadata: {
    tags: ['rare', 'dragon', 'fire'],
    version: '1.0.0',
    properties: {
      size: 'large',
      color: 'crimson',
      rarity: 'legendary',
      attributes: {
        power: 90,
        wisdom: 85,
        harmony: 75
      }
    }
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

export const testAPI = {
  async generateEgg(app, type, parameters) {
    return request(app)
      .post('/api/generate-egg')
      .set(DEFAULT_HEADERS)
      .send({ type, parameters });
  },

  async generateEggs(app, types) {
    return Promise.all(
      types.map(type => this.generateEgg(app, type, { size: 'medium' }))
    );
  },

  async generateConcurrentEggs(app, count, type, parameters) {
    return Promise.all(
      Array(count).fill().map(() => this.generateEgg(app, type, parameters))
    );
  }
};

export const calculateStatistics = {
  average: (numbers, initial = 0) =>
    numbers.reduce((sum, num) => sum + num, initial) / (numbers.length || 1),

  deviation: (numbers) => {
    const max = Math.max(...numbers);
    const min = Math.min(...numbers);
    return max - min;
  }
};
