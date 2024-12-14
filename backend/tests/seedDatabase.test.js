import request from 'supertest';
import dotenv from 'dotenv';

import { startServer, stopServer } from '../index.js';

// Load environment variables
dotenv.config();

let app, server;

// Mock rules to seed into the database
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

describe('Seed Database Tests', () => {
  it('should seed the database with rules via API', async () => {
    const response = await request(app).post('/api/rules').send(rules);
    expect(response.statusCode).toBe(201);
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
    const invalidInput = { weather: 'sunny', temp: 'hot' }; // Invalid keys
    const response = await request(app)
      .post('/api/aiService')
      .send({ input: invalidInput });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error', 'Invalid input format');
  });

  it('should return all seeded rules from the database', async () => {
    const response = await request(app).get('/api/rules');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(rules.length);

    response.body.forEach((rule, index) => {
      expect(rule).toHaveProperty('name', rules[index].name);
      expect(rule).toHaveProperty('description', rules[index].description);
      expect(rule).toHaveProperty('condition');
      expect(rule.condition).toEqual(rules[index].condition);
      expect(rule).toHaveProperty('action', rules[index].action);
    });
  });

  it('should handle duplicate rule entries gracefully', async () => {
    const response = await request(app).post('/api/rules').send(rules);
    expect(response.statusCode).toBe(409); // Assuming 409 Conflict for duplicates
    expect(response.body).toHaveProperty('error', 'Duplicate rules detected');
  });
});
