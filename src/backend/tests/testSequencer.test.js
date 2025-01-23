import request from 'supertest';

import { startServer, stopServer } from '../index';

let app, server;

beforeAll(async () => {
  try {
    ({ app, server } = await startServer(0));
  } catch (err) {
    console.error('Error starting server:', err);
    throw err;
  }
});

afterAll(async () => {
  try {
    await stopServer(server);
  } catch (err) {
    console.error('Error stopping server:', err);
    throw err;
  }
});

describe('API Integration Tests', () => {
  it('should return 200 for the basic test endpoint', async () => {
    const response = await request(app).get('/api/basic-test');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Basic test passed');
  });

  it('should return dependencies and outdated modules from /api/dependencies', async () => {
    const response = await request(app).get('/api/dependencies');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('dependencies');
    expect(Array.isArray(response.body.dependencies)).toBe(true);
    expect(response.body).toHaveProperty('outdated');
    expect(Array.isArray(response.body.outdated)).toBe(true);
  });

  it('should resolve and return conflicts from /api/dependencies/conflicts', async () => {
    const response = await request(app).get('/api/dependencies/conflicts');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('resolved');
    expect(Array.isArray(response.body.resolved)).toBe(true);
    expect(response.body).toHaveProperty('conflicts');
    expect(Array.isArray(response.body.conflicts)).toBe(true);
  });

  it('should generate an egg successfully with valid input', async () => {
    const eggOptions = { type: 'chicken', color: 'brown' };
    const response = await request(app)
      .post('/api/generate-egg')
      .send(eggOptions);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('egg');
    expect(response.body.egg).toMatchObject(eggOptions);
  });

  it('should return 400 for invalid egg generation input', async () => {
    const invalidOptions = { type: '', color: 'brown' };
    const response = await request(app)
      .post('/api/generate-egg')
      .send(invalidOptions);
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Invalid input');
  });
});
