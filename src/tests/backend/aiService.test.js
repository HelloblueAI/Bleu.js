import request from 'supertest';
import { startServer, stopServer } from '../../src/backend/index.js'; // Corrected path
import decisionTreeService from '../../src/backend/services/decisionTreeService.js';

let app, server;

beforeAll(async () => {
  server = await startServer();
  app = server.app;

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
});

afterAll(async () => {
  await stopServer(server);
});

describe('AI Service', () => {
  it('should process valid input and return AI-generated result', async () => {
    const response = await request(app)
      .post('/api/doSomething')
      .send({ text: 'test' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('result');
  });

  it('should handle empty request body', async () => {
    const response = await request(app).post('/api/doSomething').send({});
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});
