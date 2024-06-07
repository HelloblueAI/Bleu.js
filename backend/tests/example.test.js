const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Hello, World!' });
});

app.post('/data', async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ message: 'Bad Request' });
    }

    if (data === 'Async Error') {
      throw new Error('Simulated Async Error');
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    res.status(201).json({ message: 'Data received', data });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Bad Request' });
  }
  next();
});

module.exports = app;

// Tests
describe('API Tests', () => {
  beforeAll(() => {
    jest.setTimeout(10000); 
  });

  it('should return Hello, World! on GET /', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Hello, World!');
  });

  it('should create data on POST /data', async () => {
    const testData = ['Sample Data 1', 'Sample Data 2'];
    const promises = testData.map(async (data) => {
      const res = await request(app)
        .post('/data')
        .send({ data });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('message', 'Data received');
      expect(res.body).toHaveProperty('data', data);
    });
    await Promise.all(promises);
  });

  it.each`
    path             | body
    ${'/data'}       | ${{}}
    ${'/nonexistent'}| ${null}
    ${'/data'}       | ${'Invalid JSON'}
  `('should handle $path with body $body', async ({ path, body }) => {
    const res = await request(app)
      .post(path)
      .set('Content-Type', 'application/json')
      .send(body);
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Bad Request');
  });

  it('should handle asynchronous errors gracefully', async () => {
    const res = await request(app)
      .post('/data')
      .send({ data: 'Async Error' });
    expect(res.statusCode).toEqual(500);
    expect(res.body).toHaveProperty('message', 'Internal Server Error');
  });

  it('should handle edge cases', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty('message', 'Not Found');
  });

  it('should ensure performance meets expectations', async () => {
    const start = Date.now();
    await request(app).get('/');
    const end = Date.now();
    const duration = end - start;
    expect(duration).toBeLessThan(100); 
  });

  it('should return 400 for missing data field in POST /data', async () => {
    const res = await request(app).post('/data').send({});
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Bad Request');
  });

  it('should return 500 for simulated server error in POST /data', async () => {
    const res = await request(app)
      .post('/data')
      .send({ data: 'Async Error' });
    expect(res.statusCode).toEqual(500);
    expect(res.body).toHaveProperty('message', 'Internal Server Error');
  });

  it('should handle invalid JSON gracefully', async () => {
    const res = await request(app)
      .post('/data')
      .set('Content-Type', 'application/json')
      .send('Invalid JSON');
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Bad Request');
  });

  it('should handle very large data payloads', async () => {
    const largeData = 'A'.repeat(10000);
    const res = await request(app)
      .post('/data')
      .send({ data: largeData });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Data received');
    expect(res.body).toHaveProperty('data', largeData);
  });

  it('should measure response time for POST /data', async () => {
    const start = Date.now();
    const res = await request(app)
      .post('/data')
      .send({ data: 'Performance Test' });
    const end = Date.now();
    const duration = end - start;
    expect(res.statusCode).toEqual(201);
    expect(duration).toBeLessThan(200); // Ensure response time is within 200ms
  });
});
