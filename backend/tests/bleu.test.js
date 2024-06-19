const request = require('supertest');
const { app, startServer, stopServer } = require('../server');

beforeAll(async () => {
  await startServer();
});

afterAll(async () => {
  await stopServer();
});

describe('Bleu AI Tests', () => {
  it('should create data on POST /api/data', async () => {
    const res = await request(app)
      .post('/api/data')
      .send({ data: 'Test Data' });
    console.log('Response status:', res.statusCode);
    console.log('Response body:', res.body);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Data received');
  });
});
