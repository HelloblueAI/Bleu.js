/* eslint-env node, jest */
const request = require('supertest');

const app = require('../index');

describe('Decision Tree', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.console = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    };
  });

  it('should evaluate decision tree', async () => {
    const response = await request(app)
      .post('/api/decisionTree')
      .send({ input: 'test input' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('result');
  });

  it('should get decision tree', async () => {
    const response = await request(app)
      .post('/api/decisionTree')
      .send({ input: 'test input' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('result');
  });
});
