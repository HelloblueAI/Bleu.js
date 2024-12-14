const request = require('supertest');

const { startServer, stopServer } = require('../index');
const decisionTreeService = require('../services/decisionTreeService');

let app, server;

beforeAll(async () => {
  try {
    // Start the server on a dynamic port
    ({ app, server } = await startServer(0));

    // Training data for the decision tree
    const trainingData = [
      { feature1: 'A', feature2: 'X', result: 'positive' },
      { feature1: 'A', feature2: 'Y', result: 'negative' },
      { feature1: 'B', feature2: 'X', result: 'negative' },
      { feature1: 'B', feature2: 'Y', result: 'positive' },
    ];

    // Build the decision tree model
    decisionTreeService.buildDecisionTree(trainingData, 'result', [
      'feature1',
      'feature2',
    ]);
  } catch (error) {
    console.error('Error during setup:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    // Stop the server after tests
    await stopServer(server);
  } catch (error) {
    console.error('Error during teardown:', error);
  }
});

describe('AI Service API Tests', () => {
  it('should process valid input and return AI-generated result', async () => {
    const response = await request(app)
      .post('/api/aiService')
      .send({ input: { feature1: 'A', feature2: 'X' } });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('result');
    expect(['positive', 'negative']).toContain(response.body.result);
  });

  it('should handle missing input gracefully', async () => {
    const response = await request(app).post('/api/aiService').send({}); // Empty input

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error', 'Missing input');
  });

  it('should handle partially valid input gracefully', async () => {
    const response = await request(app)
      .post('/api/aiService')
      .send({ input: { feature1: 'A' } }); // Missing feature2

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error', 'Invalid input');
  });

  it('should return consistent results for valid inputs', async () => {
    const inputs = [
      { feature1: 'A', feature2: 'X' },
      { feature1: 'B', feature2: 'Y' },
    ];

    for (const input of inputs) {
      const response = await request(app)
        .post('/api/aiService')
        .send({ input });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('result');
      expect(['positive', 'negative']).toContain(response.body.result);
    }
  });

  it('should return an error for unexpected property names', async () => {
    const response = await request(app)
      .post('/api/aiService')
      .send({ input: { unexpectedFeature: 'value' } });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error', 'Invalid input properties');
  });
});
