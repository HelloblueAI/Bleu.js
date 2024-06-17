const request = require('supertest');
const { app, server } = require('../server');
const Rule = require('../models/ruleModel'); // Ensure the correct path

beforeAll(async () => {
  
});

afterAll(async () => {
  
  await server.close();
});

describe('API Routes', () => {
  beforeAll(async () => {
      await Rule.deleteMany({});
  });
  
  beforeEach(async () => {
    
    await Rule.deleteMany({});
  });

  it('GET /api/rules should return 200 with a list of rules', async () => {
    await Rule.create({ name: 'Sample Rule' });
    const res = await request(app).get('/api/rules');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(expect.any(Array));
    expect(res.body[0]).toHaveProperty('name', 'Sample Rule');
  });

  it('POST /api/rules should return 201 when a rule is successfully created', async () => {
    const res = await request(app).post('/api/rules').send({ name: 'New Rule' });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({ message: 'Rule added successfully' });
  });

  it('DELETE /api/rules/:id should return 200 when a rule is successfully deleted', async () => {
    const rule = await Rule.create({ name: 'Rule to Delete' });
    const res = await request(app).delete(`/api/rules/${rule._id}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Rule removed successfully' });
  });

  it('PUT /api/rules/:id should return 200 when a rule is successfully updated', async () => {
    const rule = await Rule.create({ name: 'Rule to Update' });
    const res = await request(app).put(`/api/rules/${rule._id}`).send({ name: 'Updated Rule' });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: 'Rule updated successfully' });
  });

  it('POST /api/rules/evaluate should return 200 with the evaluation result', async () => {
    const res = await request(app).post('/api/rules/evaluate').send({ name: 'Evaluation Rule', data: 'Test data' });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ result: 'Evaluation result' });
  });
});
