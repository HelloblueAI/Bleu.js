import express from 'express';
import { connect, disconnect } from 'mongoose';
import request from 'supertest';

import apiRoutes from '../routes/apiRoutes.mjs'; // Ensure correct `.mjs` import

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

beforeAll(async () => {
  await connect('mongodb://localhost:27017/testdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await disconnect();
});

describe('API Routes', () => {
  it('should return all rules', async () => {
    const response = await request(app).get('/api/rules');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });

  it('should create a new rule', async () => {
    const newRule = { conditions: [], actions: [] };
    const response = await request(app).post('/api/rules').send(newRule);
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('data');
  });

  it('should update a rule', async () => {
    const ruleId = 'mock-id';
    const response = await request(app)
      .put(`/api/rules/${ruleId}`)
      .send({ actions: ['approve'] });
    expect(response.status).toBe(200);
  });

  it('should delete a rule', async () => {
    const ruleId = 'mock-id';
    const response = await request(app).delete(`/api/rules/${ruleId}`);
    expect(response.status).toBe(200);
  });
});
