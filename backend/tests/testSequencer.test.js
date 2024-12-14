import mongoose from 'mongoose';
import dotenv from 'dotenv';
import request from 'supertest';

import { startServer, stopServer } from '../index';

dotenv.config();

let app, server;

beforeAll(async () => {
  mongoose.set('strictQuery', false); // Avoid deprecation warnings
  ({ app, server } = await startServer(0));
});

afterAll(async () => {
  await stopServer(server);
  await mongoose.connection.close(); // Ensure Mongoose disconnects properly
});

describe('Test Sequencer', () => {
  it('should pass a basic test', async () => {
    const response = await request(app).get('/api/basic-test');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Basic test passed');
  });

  it('should handle dependencies endpoint', async () => {
    const response = await request(app).get('/api/dependencies');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('dependencies');
    expect(response.body).toHaveProperty('outdated');
  });

  it('should handle dependency conflicts endpoint', async () => {
    const response = await request(app).get('/api/dependencies/conflicts');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('resolved');
    expect(response.body).toHaveProperty('conflicts');
  });

  it('should handle egg generation', async () => {
    const eggOptions = { type: 'chicken', color: 'brown' };
    const response = await request(app)
      .post('/api/generate-egg')
      .send(eggOptions);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('egg');
  });
});
