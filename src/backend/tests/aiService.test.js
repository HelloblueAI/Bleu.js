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

import { startServer, stopServer } from '../index';
import { buildDecisionTree } from '../services/decisionTreeService';

let app, server;

beforeAll(async () => {
  ({ app, server } = await startServer(0));

  const trainingData = [
    { feature1: 'A', feature2: 'X', result: 'positive' },
    { feature1: 'A', feature2: 'Y', result: 'negative' },
    { feature1: 'B', feature2: 'X', result: 'negative' },
    { feature1: 'B', feature2: 'Y', result: 'positive' },
  ];

  // Fix: Replace multiline array with a single line.
  buildDecisionTree(trainingData, 'result', ['feature1', 'feature2']);
});

afterAll(async () => {
  await stopServer(server);
});

describe('AI Service API', () => {
  it('should process input and return AI-generated result', async () => {
    const response = await request(app)
      .post('/api/aiService')
      .send({ input: { feature1: 'A', feature2: 'X' } });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('result');
    expect(['positive', 'negative']).toContain(response.body.result);
  });

  it('should handle invalid input gracefully', async () => {
    const response = await request(app).post('/api/aiService').send({});
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Missing input');
  });
});
