const request = require('supertest');
const app = require('../server');
const net = require('net');

let server;
let port;

// Function to find an available port
const findAvailablePort = () => {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
};

beforeAll(async () => {
  port = await findAvailablePort();
  server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}, 10000); // Increase timeout to 10 seconds

afterAll((done) => {
  if (server) {
    server.close(() => {
      console.log(`Server on port ${port} closed`);
      done();
    });
  } else {
    done();
  }
});

const retryRequest = async (fn, retries = 5, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fn();
      if (res.status !== 429) {
        return res;
      }
    } catch (err) {
      if (i === retries - 1) throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error('Exceeded maximum retries');
};

describe('API Tests', () => {
  it('should handle invalid request headers', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .post('/data')
        .set('Invalid-Header', 'Invalid')
        .send({ data: 'Test Header' })
    );
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Invalid Header');
  });

  it.each`
    path              | body
    ${'/data'}        | ${{}}
    ${'/nonexistent'} | ${null}
    ${'/data'}        | ${'Invalid JSON'}
  `('should handle $path with body $body', async ({ path, body }) => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .post(path)
        .set('Content-Type', 'application/json')
        .send(body)
    );
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Bad Request');
  });

  it('should handle asynchronous errors gracefully', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`).post('/data').send({ data: 'Async Error' })
    );
    expect(res.statusCode).toEqual(500);
    expect(res.body).toHaveProperty('message', 'Internal Server Error');
  });

  it('should handle edge cases', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`).get('/nonexistent')
    );
    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty('message', 'Not Found');
  });

  it('should ensure performance meets expectations', async () => {
    const start = Date.now();
    await retryRequest(() => request(`http://localhost:${port}`).get('/'));
    const end = Date.now();
    const duration = end - start;
    expect(duration).toBeLessThan(100);
  });

  it('should return 400 for missing data field in POST /data', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`).post('/data').send({})
    );
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Bad Request');
  });

  it('should return 500 for simulated server error in POST /data', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`).post('/data').send({ data: 'Async Error' })
    );
    expect(res.statusCode).toEqual(500);
    expect(res.body).toHaveProperty('message', 'Internal Server Error');
  });

  it('should handle invalid JSON gracefully', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .post('/data')
        .set('Content-Type', 'application/json')
        .send('Invalid JSON')
    );
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Bad Request');
  });

  it('should handle very large data payloads', async () => {
    const largeData = 'A'.repeat(10000);
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`).post('/data').send({ data: largeData })
    );
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Data received');
    expect(res.body).toHaveProperty('data', largeData);
  });

  it('should measure response time for POST /data', async () => {
    const start = Date.now();
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .post('/data')
        .send({ data: 'Performance Test' })
    );
    const end = Date.now();
    const duration = end - start;
    expect(res.statusCode).toEqual(201);
    expect(duration).toBeLessThan(200);
  });

  it('should handle simultaneous requests', async () => {
    const testData = Array.from({ length: 10 }, (_, i) => `Data ${i + 1}`);
    const promises = testData.map((data) =>
      retryRequest(() =>
        request(`http://localhost:${port}`).post('/data').send({ data })
      )
    );
    const results = await Promise.all(promises);
    results.forEach((res, i) => {
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('message', 'Data received');
      expect(res.body).toHaveProperty('data', testData[i]);
    });
  });

  it('should validate response schema', async () => {
    const res = await retryRequest(() => request(`http://localhost:${port}`).get('/'));
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        message: expect.any(String),
      })
    );
  });

  it('should stress test the server', async () => {
    const stressTestData = Array.from(
      { length: 100 },
      (_, i) => `Stress Test Data ${i + 1}`
    );
    const promises = stressTestData.map((data) =>
      retryRequest(() =>
        request(`http://localhost:${port}`).post('/data').send({ data })
      )
    );
    const results = await Promise.all(promises);
    results.forEach((res, i) => {
      expect(res.statusCode).toEqual(201);
    });
  }, 30000); // Increase timeout to 30 seconds

  it('should test with invalid routes', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`).get('/invalid-route')
    );
    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty('message', 'Not Found');
  }, 10000); // Increase timeout to 10 seconds

  it('should test JSON parsing error', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .post('/data')
        .set('Content-Type', 'application/json')
        .send('{ data: ')
    );
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Bad Request');
  }, 10000); // Increase timeout to 10 seconds

  it('should test different HTTP methods on /data', async () => {
    const resPut = await retryRequest(() =>
      request(`http://localhost:${port}`).put('/data').send({ data: 'PUT data' })
    );
    expect(resPut.statusCode).toEqual(404);

    const resDelete = await retryRequest(() =>
      request(`http://localhost:${port}`).delete('/data').send({ data: 'DELETE data' })
    );
    expect(resDelete.statusCode).toEqual(404);
  }, 10000); // Increase timeout to 10 seconds

  it('should handle very large number of simultaneous requests', async () => {
    const testData = Array.from({ length: 500 }, (_, i) => `Bulk Data ${i + 1}`);
    const promises = testData.map((data) =>
      retryRequest(() =>
        request(`http://localhost:${port}`).post('/data').send({ data })
      )
    );
    const results = await Promise.all(promises);
    results.forEach((res, i) => {
      expect(res.statusCode).toEqual(201);
    });
  }, 30000); // Increase timeout to 30 seconds

  it('should handle concurrent GET and POST requests', async () => {
    const postData = 'Concurrent Data';
    const [getRes, postRes] = await Promise.all([
      retryRequest(() => request(`http://localhost:${port}`).get('/')),
      retryRequest(() =>
        request(`http://localhost:${port}`).post('/data').send({ data: postData })
      ),
    ]);
    expect(getRes.statusCode).toEqual(200);
    expect(postRes.statusCode).toEqual(201);
    expect(postRes.body).toHaveProperty('message', 'Data received');
    expect(postRes.body).toHaveProperty('data', postData);
  }, 10000); // Increase timeout to 10 seconds

  it('should handle slow network conditions gracefully', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .post('/data')
        .set('Content-Type', 'application/json')
        .send({ data: 'Slow Network' })
        .timeout({ deadline: 5000, response: 1000 })
    );
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Data received');
    expect(res.body).toHaveProperty('data', 'Slow Network');
  }, 10000); // Increase timeout to 10 seconds

  it('should verify CORS headers', async () => {
    const res = await retryRequest(() => request(`http://localhost:${port}`).get('/'));
    expect(res.headers).toHaveProperty('access-control-allow-origin', '*');
  }, 10000); // Increase timeout to 10 seconds

  it('should handle session cookies', async () => {
    const agent = request.agent(`http://localhost:${port}`);

    await agent.get('/').expect(200);
    const res = await agent.post('/data').send({ data: 'Session Data' });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Data received');
    expect(res.body).toHaveProperty('data', 'Session Data');
  }, 10000); // Increase timeout to 10 seconds

  it('should verify content-type for POST /data', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .post('/data')
        .set('Content-Type', 'text/plain')
        .send('Plain Text Data')
    );
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Bad Request');
  }, 10000); // Increase timeout to 10 seconds

  it('should test for memory leaks', async () => {
    const heapUsedBefore = process.memoryUsage().heapUsed;
    const promises = Array.from({ length: 100 }, () =>
      retryRequest(() =>
        request(`http://localhost:${port}`).post('/data').send({ data: 'Memory Leak Test' })
      )
    );
    await Promise.all(promises);
    const heapUsedAfter = process.memoryUsage().heapUsed;

    expect(heapUsedAfter - heapUsedBefore).toBeLessThan(100 * 1024 * 1024); // less than 100MB increase
  }, 10000); // Increase timeout to 10 seconds

  it('should handle different user roles', async () => {
    const roles = ['admin', 'user', 'guest'];
    const promises = roles.map(async (role) => {
      const res = await retryRequest(() =>
        request(`http://localhost:${port}`)
          .post('/data')
          .set('Role', role)
          .send({ data: `Role: ${role}` })
      );

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('message', 'Data received');
      expect(res.body).toHaveProperty('data', `Role: ${role}`);
    });
    await Promise.all(promises);
  }, 10000); // Increase timeout to 10 seconds

  it('should handle database connectivity issues', async () => {
    jest.spyOn(global, 'setTimeout').mockImplementation((cb) => cb());

    // Simulate a database connectivity issue
    const originalImplementation = app.post;
    app.post = (path, handler) => {
      if (path === '/data') {
        handler = (req, res) => {
          return res.status(500).json({ message: 'Internal Server Error' });
        };
      }
      originalImplementation.call(app, path, handler);
    };

    const res = await retryRequest(() =>
      request(`http://localhost:${port}`).post('/data').send({ data: 'DB Test' })
    );
    expect(res.statusCode).toEqual(500);
    expect(res.body).toHaveProperty('message', 'Internal Server Error');

    jest.restoreAllMocks();
  }, 10000); // Increase timeout to 10 seconds

  it('should handle application/x-www-form-urlencoded', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .post('/data')
        .type('form')
        .send('data=Form%20Data')
    );
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Data received');
    expect(res.body).toHaveProperty('data', 'Form Data');
  }, 10000); // Increase timeout to 10 seconds

  it('should handle JSON arrays', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .post('/data')
        .send([{ data: 'Array Data 1' }, { data: 'Array Data 2' }])
    );
    expect(res.statusCode).toEqual(400); // Should fail as our endpoint expects an object
  }, 10000); // Increase timeout to 10 seconds

  it('should handle deeply nested JSON objects', async () => {
    const nestedData = { level1: { level2: { level3: { level4: 'Deep Data' } } } };
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`).post('/data').send({ data: nestedData })
    );
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Data received');
    expect(res.body.data).toEqual(nestedData);
  }, 10000); // Increase timeout to 10 seconds
});

module.exports = server;
