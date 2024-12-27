import request from 'supertest';
import { startServer, stopServer } from '../../src/backend/index.ts'; // Corrected path

let app, server;

beforeAll(async () => {
  server = await startServer();
  app = server.app;
});

afterAll(async () => {
  await stopServer(server);
});

describe('API Routes', () => {
  it('should pass a basic test', async () => {
    const response = await request(app).get('/api/basic-test');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Basic test passed');
  });

  it('should return data from a valid API route', async () => {
    const response = await request(app).get('/api/data');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('should handle invalid API routes gracefully', async () => {
    const response = await request(app).get('/api/non-existent-route');
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Not Found');
  });

  it('should handle POST requests correctly', async () => {
    const payload = { key: 'value' };
    const response = await request(app).post('/api/create').send(payload);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('message', 'Resource created');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toEqual(payload);
  });

  it('should handle edge cases for large payloads gracefully', async () => {
    const largePayload = { key: 'a'.repeat(1000000) };
    const response = await request(app).post('/api/create').send(largePayload);

    expect(response.statusCode).toBe(413);
    expect(response.body).toHaveProperty('error', 'Payload too large');
  });
});
