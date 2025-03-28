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
import mongoose from 'mongoose';
import request from 'supertest';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { startServer, stopServer } from '../../index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Database Seeding', () => {
  let server;
  let connection;

  beforeAll(async () => {
    server = await startServer();
    connection = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await stopServer();
  });

  beforeEach(async () => {
    await mongoose.connection.collection('eggs').deleteMany({});
  });

  it('should seed database with initial data', async () => {
    const response = await request(server)
      .post('/api/db/seed')
      .send({
        count: 5,
        rarity: 'common'
      });

    expect(response.status).toBe(200);
    expect(response.body.seeded).toBe(5);

    const eggs = await mongoose.connection.collection('eggs').find({}).toArray();
    expect(eggs).toHaveLength(5);
    expect(eggs[0].rarity).toBe('common');
  });

  it('should handle seeding errors gracefully', async () => {
    const response = await request(server)
      .post('/api/db/seed')
      .send({
        count: -1,
        rarity: 'invalid'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('should respect rarity distribution', async () => {
    const response = await request(server)
      .post('/api/db/seed')
      .send({
        count: 100,
        rarity: 'random'
      });

    expect(response.status).toBe(200);
    expect(response.body.seeded).toBe(100);

    const eggs = await mongoose.connection.collection('eggs').find({}).toArray();
    const rarityCounts = eggs.reduce((acc, egg) => {
      acc[egg.rarity] = (acc[egg.rarity] || 0) + 1;
      return acc;
    }, {});

    // Check if distribution is reasonable
    expect(rarityCounts.common).toBeGreaterThan(rarityCounts.rare);
    expect(rarityCounts.rare).toBeGreaterThan(rarityCounts.legendary);
  });
});
