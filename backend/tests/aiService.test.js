const request = require('supertest');

const { startServer, stopServer } = require('../index');
const decisionTreeService = require('../services/decisionTreeService');

let app, server;

beforeAll(async () => {
  ({ app, server } = await startServer(0));

  // Build a sample decision tree
  const trainingData = [
    { feature1: 'A', feature2: 'X', result: 'positive' },
    { feature1: 'A', feature2: 'Y', result: 'negative' },
    { feature1: 'B', feature2: 'X', result: 'negative' },
    { feature1: 'B', feature2: 'Y', result: 'positive' },
  ];

  decisionTreeService.buildDecisionTree(trainingData, 'result', [
    'feature1',
    'feature2',
  ]);
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
