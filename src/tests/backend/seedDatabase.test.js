import dotenv from 'dotenv';
import request from 'supertest';

import { startServer, stopServer } from '../../src/backend/index.ts'; // Corrected path

dotenv.config();

let app, server;

const rules = [
  {
    name: 'Sunny Rule',
    description: 'Handle sunny weather conditions',
    condition: { outlook: 'sunny' },
    action: 'Wear sunglasses',
  },
  {
    name: 'Rainy Rule',
    description: 'Handle rainy weather conditions',
    condition: { outlook: 'rainy' },
    action: 'Carry an umbrella',
  },
];

beforeAll(async () => {
  try {
    console.log('Starting server...');
    ({ app, server } = await startServer(0)); // Start the server on a random port
    console.log('Server started successfully.');
  } catch (error) {
    console.error('Error during setup:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    console.log('Stopping server...');
    await stopServer(server); // Stop the server after tests
    console.log('Server stopped successfully.');
  } catch (error) {
    console.error('Error during teardown:', error);
  }
});

describe('Seed Database', () => {
  it('should seed the database with rules via API', async () => {
    const response = await request(app).post('/api/rules').send(rules);

    expect(response.statusCode).toBe(201);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(rules.length);

    response.body.forEach((rule, index) => {
      expect(rule).toHaveProperty('name', rules[index].name);
      expect(rule).toHaveProperty('description', rules[index].description);
      expect(rule).toHaveProperty('condition');
      expect(rule.condition).toEqual(rules[index].condition);
      expect(rule).toHaveProperty('action', rules[index].action);
    });
  });

  it('should handle valid input with decision tree', async () => {
    const validInput = {
      outlook: 'rainy',
      temperature: 'cool',
      humidity: 'normal',
      windy: 'true',
    };

    const response = await request(app)
      .post('/api/aiService')
      .send({ input: validInput });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('result');
    expect(['yes', 'no']).toContain(response.body.result);
  });

  it('should handle invalid input gracefully', async () => {
    const invalidInput = { weather: 'sunny', temp: 'hot' };
    const response = await request(app)
      .post('/api/aiService')
      .send({ input: invalidInput });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toMatch(/invalid input/i);
  });

  it('should return all seeded rules from the database', async () => {
    const response = await request(app).get('/api/rules');

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(rules.length);
  });
});
