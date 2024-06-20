/* eslint-env node, jest */
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
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Data received');
  });

  it('should return 400 on POST /api/data with missing data', async () => {
    const res = await request(app).post('/api/data').send({});
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Bad Request');
  });

  it('should return 400 on POST /api/data with invalid header', async () => {
    const res = await request(app)
      .post('/api/data')
      .set('invalid-header', 'true')
      .send({ data: 'Test Data' });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Bad Request');
  });

  it('should simulate an async error on POST /api/data', async () => {
    const res = await request(app)
      .post('/api/data')
      .send({ data: 'Async Error' });
    expect(res.statusCode).toEqual(500);
    expect(res.body).toHaveProperty('message', 'Internal Server Error');
  });

  it('should simulate a DB test error on POST /api/data', async () => {
    const res = await request(app).post('/api/data').send({ data: 'DB Test' });
    expect(res.statusCode).toEqual(500);
    expect(res.body).toHaveProperty('message', 'Internal Server Error');
  });

  it('should return a successful response from GET /api/data', async () => {
    const res = await request(app).get('/api/data');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Hello, World!');
  });

  it('should return 404 for an unknown route', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty('message', 'Not Found');
  });
});
