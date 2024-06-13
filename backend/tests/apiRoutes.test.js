import request from 'supertest';
import express from 'express';
import apiRoutes from '../routes/apiRoutes';
import mongoose from 'mongoose';
import Rule from '../models/ruleModel';
import User from '../models/userModel'; // Assuming you have a user model
import jwt from 'jsonwebtoken'; // For token-based tests

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

jest.setTimeout(60000); // Set the timeout to 60 seconds

describe('API Routes Integration Tests', () => {
  beforeAll(async () => {
    const url = 'mongodb://127.0.0.1/test_database';
    try {
      await mongoose.connect(url);
      
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
    }
  });

  afterAll(async () => {
    try {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
    }
  });

  describe('POST /api/ai/rules', () => {
    it('should evaluate rules and return the result', async () => {
      const response = await request(app)
        .post('/api/ai/rules')
        .send({ data: { type: 'test', name: 'Unit Test' } });
      expect(response.status).toBe(200);
      expect(response.body.result).toBeDefined();
    });

    it('should return a validation error if data is missing', async () => {
      const response = await request(app)
        .post('/api/ai/rules')
        .send({});
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return an error for invalid data structure', async () => {
      const response = await request(app)
        .post('/api/ai/rules')
        .send({ invalidData: true });
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle server errors gracefully', async () => {
      const originalEvaluateRules = Rule.evaluateRules;
      Rule.evaluateRules = jest.fn().mockImplementation(() => {
        throw new Error('Async Error');
      });
      const response = await request(app)
        .post('/api/ai/rules')
        .send({ data: { type: 'error', name: 'Test Error' } });
      Rule.evaluateRules = originalEvaluateRules;
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal Server Error');
    });
  });

  describe('GET /api/rules', () => {
    it('should fetch all rules', async () => {
      const response = await request(app).get('/api/rules');
      expect(response.status).toBe(200);
      expect(response.body.rules).toBeInstanceOf(Array);
    });

    it('should return an empty array if no rules exist', async () => {
      await Rule.deleteMany({});
      const response = await request(app).get('/api/rules');
      expect(response.status).toBe(200);
      expect(response.body.rules).toEqual([]);
    });

    it('should handle server errors gracefully', async () => {
      const originalFind = Rule.find;
      Rule.find = () => { throw new Error('Async Error'); };
      const response = await request(app).get('/api/rules');
      Rule.find = originalFind;
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal Server Error');
    });
  });

  describe('User Authentication and Management', () => {
    let token;
    let userId;

    beforeAll(async () => {
      const user = new User({ username: 'testuser', password: 'testpassword' });
      await user.save();
      token = jwt.sign({ id: user._id }, 'secret', { expiresIn: '1h' });
      userId = user._id;
    });

    afterAll(async () => {
      await User.deleteMany({});
    });

    describe('POST /api/login', () => {
      it('should authenticate user and return a token', async () => {
        const response = await request(app)
          .post('/api/login')
          .send({ username: 'testuser', password: 'testpassword' });
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
        const response = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.users).toBeInstanceOf(Array);
      });
    });

    describe('GET /api/users/:id', () => {
      it('should return user by id', async () => {
        const response = await request(app).get(`/api/users/${userId}`).set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.user.username).toBe('testuser');
      });

      it('should return 404 for non-existent user', async () => {
        const response = await request(app).get('/api/users/609b8ddf9b1c431ce8a5a1f5').set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('User not found');
      });
    });

    describe('PUT /api/users/:id', () => {
      it('should update user details', async () => {
        const response = await request(app)
          .put(`/api/users/${userId}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ username: 'updateduser' });
        expect(response.status).toBe(200);
        expect(response.body.user.username).toBe('updateduser');
      });

      it('should return 404 for non-existent user', async () => {
        const response = await request(app)
          .put('/api/users/609b8ddf9b1c431ce8a5a1f5')
          .set('Authorization', `Bearer ${token}`)
          .send({ username: 'updateduser' });
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('User not found');
      });
    });

    describe('DELETE /api/users/:id', () => {
      it('should delete a user', async () => {
        const response = await request(app).delete(`/api/users/${userId}`).set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('User deleted');
      });

      it('should return 404 for non-existent user', async () => {
        const response = await request(app).delete('/api/users/609b8ddf9b1c431ce8a5a1f5').set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('User not found');
      });
    });
  });
});
