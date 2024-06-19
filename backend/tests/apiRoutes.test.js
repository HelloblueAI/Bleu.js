const request = require('supertest');
const { app, startServer, stopServer } = require('../server');

beforeAll(async () => {
  await startServer();
});

afterAll(async () => {
  await stopServer();
});

describe('API Routes Tests', () => {
  it('GET /api/rules should return 200 with a list of rules', async () => {
    const res = await request(app).get('/api/rules');
    console.log('Response status:', res.statusCode);
    console.log('Response body:', res.body);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toBeInstanceOf(Array);
  });
});
