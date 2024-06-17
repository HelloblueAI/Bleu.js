const request = require('supertest');
const { app, server, closeServer } = require('../server');
const mongoose = require('mongoose');

describe('Bleu API Tests', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://bleujsUser:bleujsPassword@localhost:27017/bleujs', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    closeServer();
  });

  it('should handle invalid HTTP methods', async () => {
    const res = await request(app).trace('/api/rules');
    console.log('Response:', res.body);
    expect(res.statusCode).toEqual(405);
    expect(res.body).toHaveProperty('message', 'Method Not Allowed');
  });

  /*
  it('should handle invalid MIME types', async () => {
    const res = await request(app).post('/api/rules').send('<data>Invalid MIME type</data>');
    console.log('Response:', res.body);
    expect(res.statusCode).toEqual(415);
    expect(res.body).toHaveProperty('message', 'Unsupported Media Type');
  });

  it('should validate maximum payload size', async () => {
    const largePayload = 'a'.repeat(10001); // Adjust as necessary
    const res = await request(app).post('/api/rules').send({ name: 'Large Payload Rule', data: largePayload });
    console.log('Response:', res.body);
    expect(res.statusCode).toEqual(413);
    expect(res.body).toHaveProperty('message', 'Payload Too Large');
  });

  it('should test rate limiting with bursts', async () => {
    const promises = Array(10).fill(request(app).post('/api/rules').send({ name: 'Rate Limit Test' }));
    const results = await Promise.all(promises);
    console.log('Results:', results.map(res => res.statusCode));
    results.slice(0, 5).forEach((res) => {
      expect(res.statusCode).toEqual(200);
    });
    results.slice(5).forEach((res) => {
      expect(res.statusCode).toEqual(429);
    });
  });

  it('should handle varying response types', async () => {
    const jsonRes = await request(app).get('/api/rules/json');
    console.log('JSON Response:', jsonRes.body);
    expect(jsonRes.statusCode).toEqual(200);
    expect(jsonRes.type).toEqual('application/json');
    expect(jsonRes.body).toHaveProperty('message', 'JSON Data');
  });

  it('should validate nested fields', async () => {
    const res = await request(app).post('/api/rules').send({ name: 'Nested', nested: { level1: { level2: 'Nested Field' } } });
    console.log('Response:', res.body);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Data received');
    expect(res.body.nested.level1.level2).toEqual('Nested Field');
  });

  it('should handle file uploads with metadata', async () => {
    const res = await request(app).post('/api/rules')
      .field('name', 'File with Metadata')
      .attach('data', Buffer.from('File Content with Metadata'), 'testfile.txt');
    console.log('Response:', res.body);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Data received');
  });

  it('should handle complex query parameters', async () => {
    const res = await request(app).get('/api/rules').query({ filter: 'test', sort: 'desc', limit: 10 });
    console.log('Response:', res.body);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Query received');
    expect(res.body.query).toEqual({ filter: 'test', sort: 'desc', limit: 10 });
  });
  */

});
