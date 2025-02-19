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
import express from 'express';
import { connect, disconnect } from 'mongoose';
import request from 'supertest';

import apiRoutes from '../routes/apiRoutes.js';

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

beforeAll(async () => {
  await connect('mongodb://localhost:27017/testdb');
});

afterAll(async () => {
  await disconnect();
});

describe('API Routes', () => {
  it('should return all rules', async () => {
    const response = await request(app).get('/api/rules');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });

  it('should create a new rule', async () => {
    const newRule = { conditions: [], actions: [] };
    const response = await request(app).post('/api/rules').send(newRule);
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('data');
  });

  it('should update a rule', async () => {
    const ruleId = 'mock-id';
    const response = await request(app)
      .put(`/api/rules/${ruleId}`)
      .send({ actions: ['approve'] });
    expect(response.status).toBe(200);
  });

  it('should delete a rule', async () => {
    const ruleId = 'mock-id';
    const response = await request(app).delete(`/api/rules/${ruleId}`);
    expect(response.status).toBe(200);
  });
});
