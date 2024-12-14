const request = require('supertest');

const { startServer, stopServer } = require('../index');

let app, server;

beforeAll(async () => {
  try {
    // Start the server on a random available port
    ({ app, server } = await startServer(0));
  } catch (error) {
    console.error('Error starting the server:', error);
    throw error; // Ensure the test fails if the server cannot start
  }
});

afterAll(async () => {
  try {
    if (server) {
      await stopServer(server);
    }
  } catch (error) {
    console.error('Error stopping the server:', error);
  }
});

describe('Bleu.js Test Suite', () => {
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
