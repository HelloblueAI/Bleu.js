const request = require('supertest');

const { startServer, stopServer } = require('../index');

let app, server;

beforeAll(async () => {
  try {
    // Start the server on a dynamic port
    ({ app, server } = await startServer(0));
    console.log('Server started successfully.');
  } catch (error) {
    console.error('Error starting the server:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    if (server) {
      await stopServer(server);
      console.log('Server stopped successfully.');
    }
  } catch (error) {
    console.error('Error stopping the server:', error);
  }
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
    expect(Array.isArray(response.body.data)).toBe(true); // Assuming it returns an array
  });

  it('should handle invalid API routes gracefully', async () => {
    const response = await request(app).get('/api/non-existent-route');
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Not Found');
  });

  it('should handle POST requests correctly', async () => {
    const payload = { name: 'Test' };
    const response = await request(app).post('/api/create').send(payload);

    expect(response.statusCode).toBe(201); // Assuming the route creates a resource
    expect(response.body).toHaveProperty('message', 'Resource created');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toEqual(payload);
  });

  it('should return 400 for POST requests with invalid payload', async () => {
    const payload = {}; // Sending an empty payload
    const response = await request(app).post('/api/create').send(payload);

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error', 'Invalid payload');
  });

  it('should handle edge cases for large payloads gracefully', async () => {
    const largePayload = { name: 'A'.repeat(10000) }; // Very large payload
    const response = await request(app).post('/api/create').send(largePayload);

    expect(response.statusCode).toBe(413); // Assuming the route returns a 413 for large payloads
    expect(response.body).toHaveProperty('error', 'Payload too large');
  });
});
