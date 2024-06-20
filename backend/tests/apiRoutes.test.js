/* eslint-env node, jest */
const request = require('supertest');

const app = require('../index');

describe('API Routes', () => {
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

  it('should predict something', async () => {
    const response = await request(app)
      .post('/api/predict')
      .send({ input: 'test input' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('prediction');
  });

  it('should upload dataset successfully', async () => {
    const response = await request(app)
      .post('/api/upload')
      .send({ data: 'some dataset' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty(
      'message',
      'Dataset uploaded successfully',
    );
  });

  it('should update rule successfully', async () => {
    const response = await request(app)
      .put('/api/rule')
      .send({ rule: 'some rule' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty(
      'message',
      'Rule updated successfully',
    );
  });

  it('should remove rule successfully', async () => {
    const response = await request(app)
      .delete('/api/rule')
      .send({ rule: 'some rule' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty(
      'message',
      'Rule removed successfully',
    );
  });

  it('should evaluate a rule', async () => {
    const ruleId = '667373d3e057b9e55c651400';
    const response = await request(app)
      .post(`/api/evaluateRule/${ruleId}`)
      .send({ data: 'test data' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('result');
  });

  it('should get rule by ID', async () => {
    const ruleId = '667373d3e057b9e55c651400';
    const response = await request(app).get(`/api/rules/${ruleId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('rule');
  });

  it('should get all rules', async () => {
    const response = await request(app).get('/api/rules');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('rules');
  });
});
