import dotenv from 'dotenv';
import mongoose from 'mongoose';
import request from 'supertest';

import { startServer, stopServer } from '../../src/backend/index';

dotenv.config();

let server;

beforeAll(async () => {
  mongoose.set('strictQuery', false); // Avoid deprecation warnings
  server = await startServer();
});

afterAll(async () => {
  await stopServer(server);
  await mongoose.connection.close(); // Ensure Mongoose disconnects properly
});

describe('Test Sequencer', () => {
  it('should pass a basic test', async () => {
    const response = await request(server).get('/api/basic-test');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Basic test passed');
  });

  it('should handle dependencies endpoint', async () => {
    const response = await request(server).get('/api/dependencies');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('dependencies');
    expect(response.body).toHaveProperty('outdated');
  });

  it('should handle dependency conflicts endpoint', async () => {
    const response = await request(server).get('/api/dependencies/conflicts');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('resolved');
    expect(response.body).toHaveProperty('conflicts');
  });

  it('should handle egg generation', async () => {
    const eggOptions = { type: 'chicken', color: 'brown' };
    const response = await request(server)
      .post('/api/generate-egg')
      .send(eggOptions);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('egg');
  });
});
