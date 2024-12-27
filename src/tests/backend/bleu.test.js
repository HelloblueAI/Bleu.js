import request from 'supertest';
import { startServer, stopServer } from '../../src/backend/index.js'; // Corrected path

let app, server;

beforeAll(async () => {
  server = await startServer();
  app = server.app;
});

afterAll(async () => {
  await stopServer(server);
});

describe('Bleu API', () => {
  it('should pass a basic test', async () => {
    const response = await request(app).get('/api/basic-test');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Basic test passed');
  });

  it('should handle a 404 for non-existent routes', async () => {
    const response = await request(app).get('/non-existent-route');
    expect(response.statusCode).toBe(404);
  });

  it('should respond to a POST request', async () => {
    const payload = { key: 'value' };
    const response = await request(app).post('/api/post-test').send(payload);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Post test passed');
    expect(response.body.data).toEqual(payload);
  });
});
