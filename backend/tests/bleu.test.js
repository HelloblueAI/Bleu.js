import request from 'supertest';

import { startServer, stopServer } from '../index';

let app, server;

beforeAll(async () => {
  ({ app, server } = await startServer(0));
});

afterAll(async () => {
  await stopServer(server);
});

describe('Bleu.js Test Suite', () => {
  it('should pass a basic test', async () => {
    const response = await request(app).get('/api/basic-test');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Basic test passed');
  });
});
