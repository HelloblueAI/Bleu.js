import request from 'supertest';
import express, { json } from 'express';
import { connect, disconnect, Types } from 'mongoose';

import router from '../routes/apiRoutes';
import { create, deleteMany } from '../models/RuleModel';
const app = express();

app.use(json());
app.use('/api', router);

beforeAll(async () => {
  await connect('mongodb://localhost:27017/testdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}, 20000);

afterAll(async () => {
  await disconnect();
}, 20000);

beforeEach(async () => {
  // Add a rule to the database before each test
  await create({
    _id: new Types.ObjectId('507f191e810c19729de860ea'),
    name: 'Test Rule',
    actions: ['approve'],
  });
}, 20000); // Increase timeout to 20 seconds

afterEach(async () => {
  // Clean up the database after each test
  await deleteMany({});
}, 20000); // Increase timeout to 20 seconds

describe('API Controller', () => {
  // Test for getRules
  it('should return rules successfully', async () => {
    const response = await request(app).get('/api/rules');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 200);
    expect(response.body).toHaveProperty('data'); // Assuming data is returned
  });

  // Test for addRule
  it('should add a rule successfully', async () => {
    const newRule = {
      conditions: [{ key: 'age', operator: 'greater_than', value: 18 }],
      actions: ['approve'],
    };

    const response = await request(app).post('/api/rules').send(newRule);
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('status', 201);
    expect(response.body.data).toHaveProperty('_id'); // Assuming MongoDB ID
  }, 20000); // Increase timeout to 20 seconds

  // Test for updateRule
  it('should update a rule successfully', async () => {
    const ruleId = '507f191e810c19729de860ea'; // Use a valid ObjectId
    const updates = { actions: ['reject'] };

    const response = await request(app)
      .put(`/api/rules/${ruleId}`)
      .send(updates);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 200);
    expect(response.body.data.actions).toContain('reject');
  }, 20000); // Increase timeout to 20 seconds

  // Test for deleteRule
  it('should delete a rule successfully', async () => {
    const ruleId = '507f191e810c19729de860ea'; // Use the same ObjectId as in beforeEach

    const response = await request(app).delete(`/api/rules/${ruleId}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 200);
  });

  // Test for monitorDependencies
  it('should monitor dependencies successfully', async () => {
    const response = await request(app).get('/api/dependencies');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data.dependencies');
  }, 10000); // Increase timeout to 10 seconds

  // Test for trainModel
  it('should train a model successfully', async () => {
    const response = await request(app)
      .post('/api/trainModel')
      .send({ datasetId: 'mock-dataset-id' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data.modelId');
  });

  // Test for invalid routes
  it('should return 404 for invalid routes', async () => {
    const response = await request(app).get('/api/nonexistent');
    expect(response.status).toBe(404);
  });
});
