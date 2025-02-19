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
    {
      outlook: 'sunny',
      temperature: 'hot',
      humidity: 'high',
      windy: 'false',
      play: 'no',
    },
    {
      outlook: 'sunny',
      temperature: 'hot',
      humidity: 'high',
      windy: 'true',
      play: 'no',
    },
    {
      outlook: 'overcast',
      temperature: 'hot',
      humidity: 'high',
      windy: 'false',
      play: 'yes',
    },
    {
      outlook: 'rainy',
      temperature: 'mild',
      humidity: 'high',
      windy: 'false',
      play: 'yes',
    },
    {
      outlook: 'rainy',
      temperature: 'cool',
      humidity: 'normal',
      windy: 'false',
      play: 'yes',
    },
    {
      outlook: 'rainy',
      temperature: 'cool',
      humidity: 'normal',
      windy: 'true',
      play: 'no',
    },
    {
      outlook: 'overcast',
      temperature: 'cool',
      humidity: 'normal',
      windy: 'true',
      play: 'yes',
    },
    {
      outlook: 'sunny',
      temperature: 'mild',
      humidity: 'high',
      windy: 'false',
      play: 'no',
    },
    {
      outlook: 'sunny',
      temperature: 'cool',
      humidity: 'normal',
      windy: 'false',
      play: 'yes',
    },
    {
      outlook: 'rainy',
      temperature: 'mild',
      humidity: 'normal',
      windy: 'false',
      play: 'yes',
    },
    {
      outlook: 'sunny',
      temperature: 'mild',
      humidity: 'normal',
      windy: 'true',
      play: 'yes',
    },
    {
      outlook: 'overcast',
      temperature: 'mild',
      humidity: 'high',
      windy: 'true',
      play: 'yes',
    },
    {
      outlook: 'overcast',
      temperature: 'hot',
      humidity: 'normal',
      windy: 'false',
      play: 'yes',
    },
    {
      outlook: 'rainy',
      temperature: 'mild',
      humidity: 'high',
      windy: 'true',
      play: 'no',
    },
  ];

  buildDecisionTree(trainingData, 'play', [
    'outlook',
    'temperature',
    'humidity',
    'windy',
  ]);
});

afterAll(async () => {
  await stopServer(server);
});

describe('Decision Tree', () => {
  it('should pass a basic test', async () => {
    const response = await request(app).get('/api/basic-test');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Basic test passed');
  });

  it('should handle decision tree requests', async () => {
    const testData = {
      outlook: 'sunny',
      temperature: 'mild',
      humidity: 'normal',
      windy: 'true',
    };
    const response = await request(app)
      .post('/api/aiService')
      .send({ input: testData });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('result');
    expect(['yes', 'no']).toContain(response.body.result);
  });
});
