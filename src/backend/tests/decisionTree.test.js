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
