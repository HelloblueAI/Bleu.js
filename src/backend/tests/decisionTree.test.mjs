import request from 'supertest';
import { startServer, stopServer } from '../index.mjs';
import { buildDecisionTree } from '../services/decisionTreeService.mjs';

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

  // Build the decision tree before tests
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

describe('🧠 Decision Tree API Tests', () => {
  it('✅ Should return a successful response for a basic API check', async () => {
    const response = await request(app).get('/api/basic-test');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Basic test passed');
  });

  it('✅ Should correctly classify decision tree predictions', async () => {
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

  it('🚨 Should handle invalid input gracefully', async () => {
    const response = await request(app).post('/api/aiService').send({});
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Missing input');
  });

  it('✅ Should handle multiple concurrent decision tree requests correctly', async () => {
    const testCases = [
      {
        outlook: 'overcast',
        temperature: 'cool',
        humidity: 'normal',
        windy: 'false',
      },
      { outlook: 'sunny', temperature: 'hot', humidity: 'high', windy: 'true' },
      {
        outlook: 'rainy',
        temperature: 'mild',
        humidity: 'high',
        windy: 'false',
      },
    ];

    const responses = await Promise.all(
      testCases.map((data) =>
        request(app).post('/api/aiService').send({ input: data }),
      ),
    );

    responses.forEach((response) => {
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('result');
      expect(['yes', 'no']).toContain(response.body.result);
    });
  });

  it('🚨 Should return 404 for an invalid route', async () => {
    const response = await request(app).get('/api/nonexistent');
    expect(response.statusCode).toBe(404);
  });
});
