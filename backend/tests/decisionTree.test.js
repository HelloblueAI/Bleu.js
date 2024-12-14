import request from 'supertest';

import { startServer, stopServer } from '../index.js';
import decisionTreeService from '../services/decisionTreeService.js';

let app, server;

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

beforeAll(async () => {
  try {
    // Start the server with a dynamic port
    ({ app, server } = await startServer(0));

    // Build the decision tree model
    await decisionTreeService.buildDecisionTree(trainingData, 'play', [
      'outlook',
      'temperature',
      'humidity',
      'windy',
    ]);
  } catch (error) {
    console.error('Error during beforeAll setup:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    if (server) {
      await stopServer(server);
    }
  } catch (error) {
    console.error('Error during afterAll teardown:', error);
  }
});

describe('Decision Tree API Tests', () => {
  it('should return valid results for a decision tree request', async () => {
    const testData = {
      outlook: 'sunny',
      temperature: 'mild',
      humidity: 'normal',
      windy: 'true',
    };
    const response = await request(app)
      .post('/api/decision-tree')
      .send({ input: testData });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('result');
    expect(['yes', 'no']).toContain(response.body.result);
  });

  it('should handle empty input gracefully', async () => {
    const response = await request(app)
      .post('/api/decision-tree')
      .send({ input: {} });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error', 'Invalid input');
  });

  it('should handle invalid input properties', async () => {
    const response = await request(app)
      .post('/api/decision-tree')
      .send({ input: { weather: 'sunny', temperature: 'mild' } });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty(
      'error',
      'Missing expected input properties',
    );
  });

  it('should handle additional properties in input', async () => {
    const testData = {
      outlook: 'rainy',
      temperature: 'cool',
      humidity: 'normal',
      windy: 'false',
      extraField: 'extra',
    };
    const response = await request(app)
      .post('/api/decision-tree')
      .send({ input: testData });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('result');
    expect(['yes', 'no']).toContain(response.body.result);
  });

  it('should validate missing expected property', async () => {
    const incompleteInput = {
      outlook: 'sunny',
      temperature: 'mild',
      windy: 'true',
    };
    const response = await request(app)
      .post('/api/decision-tree')
      .send({ input: incompleteInput });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error', 'Missing humidity property');
  });

  it('should handle extreme input values gracefully', async () => {
    const extremeInput = {
      outlook: 'sunny',
      temperature: 'very very hot',
      humidity: 'extreme',
      windy: 'extremely false',
    };
    const response = await request(app)
      .post('/api/decision-tree')
      .send({ input: extremeInput });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('result');
    expect(['yes', 'no']).toContain(response.body.result);
  });

  it('should process multiple inputs correctly', async () => {
    const testCases = [
      {
        outlook: 'sunny',
        temperature: 'hot',
        humidity: 'high',
        windy: 'false',
      },
      {
        outlook: 'overcast',
        temperature: 'cool',
        humidity: 'normal',
        windy: 'true',
      },
      {
        outlook: 'rainy',
        temperature: 'mild',
        humidity: 'normal',
        windy: 'false',
      },
    ];

    for (const testCase of testCases) {
      const response = await request(app)
        .post('/api/decision-tree')
        .send({ input: testCase });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('result');
      expect(['yes', 'no']).toContain(response.body.result);
    }
  });
});
