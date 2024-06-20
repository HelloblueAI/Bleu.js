/* eslint-env node, jest */
const request = require('supertest');

const app = require('../index');

describe('API Routes', () => {
  afterAll(() => {
    global.console.log.mockRestore();
    global.console.error.mockRestore();
    global.console.warn.mockRestore();
    global.console.info.mockRestore();
    global.console.debug.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    global.console.log = jest.fn();
    global.console.error = jest.fn();
    global.console.warn = jest.fn();
    global.console.info = jest.fn();
    global.console.debug = jest.fn();
  });

  it('should predict something', async () => {
    const response = await request(app)
      .post('/api/predict')
      .send({ input: 'test input' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('prediction');
  });

  it('should process data', async () => {
    const response = await request(app)
      .post('/api/processData')
      .send({ data: 'test data' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('processedData');
  });

  it('should get processed data', async () => {
    const response = await request(app).get('/api/getProcessedData');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('processedData');
  });

  it('should train model', async () => {
    const response = await request(app)
      .post('/api/trainModel')
      .send({ modelInfo: 'test model info' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message', 'Model training started');
  });

  it('should get train model status', async () => {
    const response = await request(app).get('/api/trainModel/status');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('status');
  });

  it('should upload dataset', async () => {
    const response = await request(app)
      .post('/api/uploadDataset')
      .send({ dataset: 'test dataset' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty(
      'message',
      'Dataset uploaded successfully',
    );
  });

  it('should add a rule', async () => {
    const response = await request(app)
      .post('/api/rules')
      .send({ name: 'test rule', description: 'test description' });
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('message', 'Rule added successfully');
  });

  it('should update a rule', async () => {
    const ruleId = '667373d3e057b9e55c651400';
    const response = await request(app)
      .put(`/api/rules/${ruleId}`)
      .send({ name: 'updated rule', description: 'updated description' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty(
      'message',
      'Rule updated successfully',
    );
  });

  it('should delete a rule', async () => {
    const ruleId = '667373d3e057b9e55c651400';
    const response = await request(app).delete(`/api/rules/${ruleId}`);
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
});
