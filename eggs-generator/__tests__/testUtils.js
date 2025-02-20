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
import request from 'supertest';

export const DEFAULT_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
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
        harmony: 75,
      },
    },
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
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
      types.map((type) => this.generateEgg(app, type, { size: 'medium' })),
    );
  },

  async generateConcurrentEggs(app, count, type, parameters) {
    return Promise.all(
      Array(count)
        .fill()
        .map(() => this.generateEgg(app, type, parameters)),
    );
  },
};

export const calculateStatistics = {
  average: (numbers, initial = 0) =>
    numbers.reduce((sum, num) => sum + num, initial) / (numbers.length || 1),

  deviation: (numbers) => {
    const max = Math.max(...numbers);
    const min = Math.min(...numbers);
    return max - min;
  },
};
