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

describe('AI Tests', () => {
  it('should log info when doSomething is called', async () => {
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
