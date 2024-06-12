import request from 'supertest';
import express from 'express';
import apiRoutes from '../routes/apiRoutes';
import mongoose from 'mongoose';
import Rule from '../models/ruleModel';

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

describe('API Routes', () => {
  beforeAll(async () => {
    const url = 'mongodb://127.0.0.1/test_database';
    await mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  describe('POST /ai/rules', () => {
    it('should evaluate rules and return result', async () => {
      const response = await request(app)
        .post('/api/ai/rules')
        .send({ data: { type: 'test', name: 'Unit Test' } });
      expect(response.status).toBe(200);
      expect(response.body.result).toBeDefined();
    });

    it('should return validation error if data is missing', async () => {
      const response = await request(app)
        .post('/api/ai/rules')
        .send({});
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return error for invalid data structure', async () => {
      const response = await request(app)
        .post('/api/ai/rules')
        .send({ invalidData: true });
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle server error gracefully', async () => {
      const response = await request(app)
        .post('/api/ai/rules')
        .send({ data: 'Async Error' });
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal Server Error');
    });
  });

  describe('POST /ai/decision', () => {
    it('should predict decision and return result', async () => {
      const response = await request(app)
        .post('/api/ai/decision')
        .send({ data: { type: 'test', name: 'Decision Test' } });
      expect(response.status).toBe(200);
      expect(response.body.result).toBeDefined();
    });

    it('should return validation error if data is missing', async () => {
      const response = await request(app)
        .post('/api/ai/decision')
        .send({});
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return error for invalid data structure', async () => {
      const response = await request(app)
        .post('/api/ai/decision')
        .send({ invalidData: true });
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle server error gracefully', async () => {
      const response = await request(app)
        .post('/api/ai/decision')
        .send({ data: 'Async Error' });
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal Server Error');
    });
  });

  describe('POST /ai/nlp', () => {
    it('should process text and return result', async () => {
      const response = await request(app)
        .post('/api/ai/nlp')
        .send({ text: 'Hello, world!' });
      expect(response.status).toBe(200);
      expect(response.body.result).toBeDefined();
    });

    it('should return validation error if text is missing', async () => {
      const response = await request(app)
        .post('/api/ai/nlp')
        .send({});
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return error for invalid text structure', async () => {
      const response = await request(app)
        .post('/api/ai/nlp')
        .send({ invalidText: true });
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle server error gracefully', async () => {
      const response = await request(app)
        .post('/api/ai/nlp')
        .send({ text: 'Async Error' });
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal Server Error');
    });
  });

  describe('POST /rules', () => {
    it('should create a rule and return it', async () => {
      const ruleData = {
        name: 'Test Rule',
        conditions: ['condition1'],
        actions: ['action1'],
        priority: 1
      };
      const response = await request(app)
        .post('/api/rules')
        .send(ruleData);
      expect(response.status).toBe(201);
      expect(response.body.rule).toMatchObject(ruleData);
    });

    it('should return validation error if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/rules')
        .send({});
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return error for invalid rule structure', async () => {
      const response = await request(app)
        .post('/api/rules')
        .send({ invalidRule: true });
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle server error gracefully', async () => {
      const response = await request(app)
        .post('/api/rules')
        .send({ name: 'Async Error' });
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal Server Error');
    });
  });

  describe('PUT /rules/:id', () => {
    it('should update a rule and return it', async () => {
      const rule = new Rule({
        name: 'Rule to Update',
        conditions: ['condition1'],
        actions: ['action1'],
        priority: 1
      });
      await rule.save();
      const updatedData = { name: 'Updated Rule' };
      const response = await request(app)
        .put(`/api/rules/${rule._id}`)
        .send(updatedData);
      expect(response.status).toBe(200);
      expect(response.body.rule.name).toBe('Updated Rule');
    });

    it('should return 404 if rule is not found', async () => {
      const response = await request(app)
        .put('/api/rules/609b8ddf9b1c431ce8a5a1f5')
        .send({ name: 'Nonexistent Rule' });
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Rule not found');
    });

    it('should return validation error if data is invalid', async () => {
      const response = await request(app)
        .put('/api/rules/609b8ddf9b1c431ce8a5a1f5')
        .send({ invalidData: true });
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle server error gracefully', async () => {
      const rule = new Rule({
        name: 'Rule to Update',
        conditions: ['condition1'],
        actions: ['action1'],
        priority: 1
      });
      await rule.save();
      const response = await request(app)
        .put(`/api/rules/${rule._id}`)
        .send({ name: 'Async Error' });
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal Server Error');
    });
  });

  describe('DELETE /rules/:id', () => {
    it('should delete a rule and return success message', async () => {
      const rule = new Rule({
        name: 'Rule to Delete',
        conditions: ['condition1'],
        actions: ['action1'],
        priority: 1
      });
      await rule.save();
      const response = await request(app)
        .delete(`/api/rules/${rule._id}`);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Rule deleted');
    });

    it('should return 404 if rule is not found', async () => {
      const response = await request(app)
        .delete('/api/rules/609b8ddf9b1c431ce8a5a1f5');
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Rule not found');
    });

    it('should handle server error gracefully', async () => {
      const rule = new Rule({
        name: 'Rule to Delete',
        conditions: ['condition1'],
        actions: ['action1'],
        priority: 1
      });
      await rule.save();
      const response = await request(app)
        .delete(`/api/rules/${rule._id}`)
        .send({ name: 'Async Error' });
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal Server Error');
    });
  });

  describe('GET /rules', () => {
    it('should fetch all rules', async () => {
      const response = await request(app).get('/api/rules');
      expect(response.status).toBe(200);
      expect(response.body.rules).toBeInstanceOf(Array);
    });

    it('should return empty array if no rules exist', async () => {
      await Rule.deleteMany({});
      const response = await request(app).get('/api/rules');
      expect(response.status).toBe(200);
      expect(response.body.rules).toEqual([]);
    });

    it('should handle server error gracefully', async () => {
      const originalFind = Rule.find;
      Rule.find = () => { throw new Error('Async Error'); };
      const response = await request(app).get('/api/rules');
      Rule.find = originalFind;
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal Server Error');
    });
  });

  describe('GET /rules/:id', () => {
    it('should fetch a rule by id', async () => {
      const rule = new Rule({
        name: 'Rule to Fetch',
        conditions: ['condition1'],
        actions: ['action1'],
        priority: 1
      });
      await rule.save();
      const response = await request(app)
        .get(`/api/rules/${rule._id}`);
      expect(response.status).toBe(200);
      expect(response.body.rule.name).toBe('Rule to Fetch');
    });

    it('should return 404 if rule is not found', async () => {
      const response = await request(app)
        .get('/api/rules/609b8ddf9b1c431ce8a5a1f5');
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Rule not found');
    });

    it('should handle server error gracefully', async () => {
      const originalFindById = Rule.findById;
      Rule.findById = () => { throw new Error('Async Error'); };
      const response = await request(app)
        .get('/api/rules/609b8ddf9b1c431ce8a5a1f5');
      Rule.findById = originalFindById;
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal Server Error');
    });
  });

  describe('GET /rules/:id/logs', () => {
    it('should fetch logs of a rule by id', async () => {
      const rule = new Rule({
        name: 'Rule with Logs',
        conditions: ['condition1'],
        actions: ['action1'],
        priority: 1,
        logs: ['Log1', 'Log2']
      });
      await rule.save();
      const response = await request(app)
        .get(`/api/rules/${rule._id}/logs`);
      expect(response.status).toBe(200);
      expect(response.body.logs).toEqual(['Log1', 'Log2']);
    });

    it('should return 404 if rule is not found', async () => {
      const response = await request(app)
        .get('/api/rules/609b8ddf9b1c431ce8a5a1f5/logs');
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Rule not found');
    });

    it('should handle server error gracefully', async () => {
      const originalFindById = Rule.findById;
      Rule.findById = () => { throw new Error('Async Error'); };
      const response = await request(app)
        .get('/api/rules/609b8ddf9b1c431ce8a5a1f5/logs');
      Rule.findById = originalFindById;
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal Server Error');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
    });
  });

  describe('POST /api/login', () => {
    it('should authenticate user and return token', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'test', password: 'test' });
      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'wrong', password: 'wrong' });
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('POST /api/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({ username: 'newuser', password: 'newpassword' });
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered');
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({ username: 'newuser' });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Password is required');
    });
  });

  describe('GET /api/users', () => {
    it('should return a list of users', async () => {
      const response = await request(app).get('/api/users');
      expect(response.status).toBe(200);
      expect(response.body.users).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      const user = { username: 'testuser', password: 'testpassword' };
      const response1 = await request(app).post('/api/register').send(user);
      const userId = response1.body.userId;

      const response2 = await request(app).get(`/api/users/${userId}`);
      expect(response2.status).toBe(200);
      expect(response2.body.user.username).toBe('testuser');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app).get('/api/users/609b8ddf9b1c431ce8a5a1f5');
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user details', async () => {
      const user = { username: 'testuser', password: 'testpassword' };
      const response1 = await request(app).post('/api/register').send(user);
      const userId = response1.body.userId;

      const response2 = await request(app)
        .put(`/api/users/${userId}`)
        .send({ username: 'updateduser' });
      expect(response2.status).toBe(200);
      expect(response2.body.user.username).toBe('updateduser');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/api/users/609b8ddf9b1c431ce8a5a1f5')
        .send({ username: 'updateduser' });
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete a user', async () => {
      const user = { username: 'testuser', password: 'testpassword' };
      const response1 = await request(app).post('/api/register').send(user);
      const userId = response1.body.userId;

      const response2 = await request(app).delete(`/api/users/${userId}`);
      expect(response2.status).toBe(200);
      expect(response2.body.message).toBe('User deleted');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app).delete('/api/users/609b8ddf9b1c431ce8a5a1f5');
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });
  });
});
