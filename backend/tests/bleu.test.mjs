import request from 'supertest';
import app from '../src/index.mjs'; // Update the import to point to your app's entry file
import net from 'net';

let server;
let port;

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
}, 10000);

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
    expect(res.body).toHaveProperty('message', 'Bad Request');
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
  }, 30000);

  it('should test with invalid routes', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`).get('/invalid-route')
    );
    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty('message', 'Not Found');
  }, 10000);

  it('should test JSON parsing error', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .post('/data')
        .set('Content-Type', 'application/json')
        .send('{ data: ')
    );
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Bad Request');
  }, 10000);

  it('should test different HTTP methods on /data', async () => {
    const resPut = await retryRequest(() =>
      request(`http://localhost:${port}`).put('/data').send({ data: 'PUT data' })
    );
    expect(resPut.statusCode).toEqual(404);

    const resDelete = await retryRequest(() =>
      request(`http://localhost:${port}`).delete('/data').send({ data: 'DELETE data' })
    );
    expect(resDelete.statusCode).toEqual(404);
  }, 10000);

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
  }, 30000);

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
  }, 10000);

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
  }, 10000);

  it('should verify CORS headers', async () => {
    const res = await retryRequest(() => request(`http://localhost:${port}`).get('/'));
    expect(res.headers).toHaveProperty('access-control-allow-origin', '*');
  }, 10000);

  it('should handle session cookies', async () => {
    const agent = request.agent(`http://localhost:${port}`);

    await agent.get('/').expect(200);
    const res = await agent.post('/data').send({ data: 'Session Data' });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Data received');
    expect(res.body).toHaveProperty('data', 'Session Data');
  }, 10000);

  it('should verify content-type for POST /data', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .post('/data')
        .set('Content-Type', 'text/plain')
        .send('Plain Text Data')
    );
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Bad Request');
  }, 10000);

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
  }, 10000);

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
  }, 10000);

  it('should handle database connectivity issues', async () => {
    jest.spyOn(global, 'setTimeout').mockImplementation((cb) => cb());

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
  }, 10000);

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
  }, 10000);

  it('should handle JSON arrays', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .post('/data')
        .send([{ data: 'Array Data 1' }, { data: 'Array Data 2' }])
    );
    expect(res.statusCode).toEqual(400);
  }, 10000);

  it('should handle deeply nested JSON objects', async () => {
    const nestedData = { level1: { level2: { level3: { level4: 'Deep Data' } } } };
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`).post('/data').send({ data: nestedData })
    );
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Data received');
    expect(res.body.data).toEqual(nestedData);
  }, 10000);

  it('should handle complex nested JSON objects', async () => {
    const complexNestedData = {
      level1: {
        level2: {
          level3: [
            { level4: 'Complex Data 1' },
            { level4: 'Complex Data 2' },
            { level4: { level5: 'Even Deeper' } },
          ],
        },
      },
    };
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`).post('/data').send({ data: complexNestedData })
    );
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Data received');
    expect(res.body.data).toEqual(complexNestedData);
  }, 10000);

  it('should handle file uploads', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .post('/upload')
        .attach('data', Buffer.from('File Content'), 'testfile.txt')
    );
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Data received');
    expect(res.body).toHaveProperty('data', 'File Content');
  }, 10000);

  it('should test rate limiting', async () => {
    const res1 = await retryRequest(() => request(`http://localhost:${port}`).get('/'));
    const res2 = await retryRequest(() => request(`http://localhost:${port}`).get('/'));
    const res3 = await retryRequest(() => request(`http://localhost:${port}`).get('/'));
    const res4 = await retryRequest(() => request(`http://localhost:${port}`).get('/'));
    const res5 = await retryRequest(() => request(`http://localhost:${port}`).get('/'));
    const res6 = await retryRequest(() => request(`http://localhost:${port}`).get('/'));
    expect(res6.statusCode).toEqual(429);
  }, 10000);

  it('should handle malformed JSON', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .post('/data')
        .set('Content-Type', 'application/json')
        .send('{ malformed JSON')
    );
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Bad Request');
  }, 10000);

  it('should handle empty POST /data', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`).post('/data').send({})
    );
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Bad Request');
  }, 10000);

  it('should return 404 for GET /nonexistent', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`).get('/nonexistent')
    );
    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty('message', 'Not Found');
  }, 10000);

  it('should handle nested routes', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`).get('/api/nested/route')
    );
    expect(res.statusCode).toEqual(404);
  }, 10000);

  it('should handle concurrent requests', async () => {
    const promises = [
      retryRequest(() => request(`http://localhost:${port}`).get('/')),
      retryRequest(() => request(`http://localhost:${port}`).post('/data').send({ data: 'Concurrent Data' })),
      retryRequest(() => request(`http://localhost:${port}`).get('/')),
    ];
    const [getRes1, postRes, getRes2] = await Promise.all(promises);
    expect(getRes1.statusCode).toEqual(200);
    expect(postRes.statusCode).toEqual(201);
    expect(postRes.body).toHaveProperty('message', 'Data received');
    expect(getRes2.statusCode).toEqual(200);
  }, 10000);

  it('should handle file uploads with large files', async () => {
    const largeFile = Buffer.alloc(1024 * 1024, 'A'); // 1MB file
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .post('/upload')
        .attach('data', largeFile, 'largefile.txt')
    );
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Data received');
    expect(res.body).toHaveProperty('data', largeFile.toString());
  }, 10000);

  it('should validate required fields in POST /data', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`).post('/data').send({})
    );
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Bad Request');
  }, 10000);

  it('should handle slow responses', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .get('/')
        .timeout({ deadline: 2000, response: 1000 })
    );
    expect(res.statusCode).toEqual(200);
  }, 10000);

  it('should handle unauthorized access', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .get('/protected')
        .set('Authorization', 'Bearer invalidtoken')
    );
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message', 'Unauthorized');
  }, 10000);

  it('should handle authorized access', async () => {
    const validToken = 'validtoken'; // Replace with a valid token
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`)
    );
    expect(res.statusCode).toEqual(200);
  }, 10000);

  it('should handle invalid URL parameters', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`).get('/data/invalid-param')
    );
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Bad Request');
  }, 10000);

  it('should handle multipart/form-data', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .post('/upload')
        .field('name', 'Test File')
        .attach('file', Buffer.from('Test Content'), 'testfile.txt')
    );
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'File uploaded');
  }, 10000);

  it('should handle PUT /data', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .put('/data')
        .send({ data: 'Updated Data' })
    );
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Data updated');
  }, 10000);

  it('should handle DELETE /data', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .delete('/data')
        .send({ data: 'Delete Data' })
    );
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Data deleted');
  }, 10000);

  it('should handle PATCH /data', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .patch('/data')
        .send({ data: 'Patch Data' })
    );
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Data patched');
  }, 10000);

  it('should handle HEAD /data', async () => {
    const res = await retryRequest(() => request(`http://localhost:${port}`).head('/data'));
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({});
  }, 10000);

  it('should handle OPTIONS /data', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`).options('/data')
    );
    expect(res.statusCode).toEqual(200);
    expect(res.headers).toHaveProperty('access-control-allow-methods');
  }, 10000);

  it('should handle complex JSON payloads', async () => {
    const complexData = {
      level1: {
        level2: [
          { level3: 'Data 1' },
          { level3: 'Data 2', level4: [{ level5: 'Nested Data' }] },
        ],
      },
    };
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`).post('/data').send({ data: complexData })
    );
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Data received');
    expect(res.body.data).toEqual(complexData);
  }, 10000);



  it('should handle invalid HTTP methods', async () => {
    const res = await retryRequest(() => request(`http://localhost:${port}`).trace('/data'));
    expect(res.statusCode).toEqual(405);
    expect(res.body).toHaveProperty('message', 'Method Not Allowed');
  }, 10000);

  it('should handle invalid MIME types', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .post('/data')
        .set('Content-Type', 'application/xml')
        .send('<data>Invalid MIME type</data>')
    );
    expect(res.statusCode).toEqual(415);
    expect(res.body).toHaveProperty('message', 'Unsupported Media Type');
  }, 10000);

  it('should validate maximum payload size', async () => {
    const largePayload = 'A'.repeat(1024 * 1024 * 2); // 2MB payload
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`).post('/data').send({ data: largePayload })
    );
    expect(res.statusCode).toEqual(413);
    expect(res.body).toHaveProperty('message', 'Payload Too Large');
  }, 10000);

  it('should test rate limiting with bursts', async () => {
    const promises = Array.from({ length: 10 }, () =>
      retryRequest(() => request(`http://localhost:${port}`).get('/'))
    );
    const results = await Promise.all(promises);
    results.slice(0, 5).forEach((res) => {
      expect(res.statusCode).toEqual(200);
    });
    results.slice(5).forEach((res) => {
      expect(res.statusCode).toEqual(429);
    });
  }, 10000);

  it('should handle chained requests', async () => {
    const res1 = await retryRequest(() => request(`http://localhost:${port}`).get('/'));
    const res2 = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .post('/data')
        .send({ data: 'Chained Request' })
    );
    const res3 = await retryRequest(() => request(`http://localhost:${port}`).get('/'));
    expect(res1.statusCode).toEqual(200);
    expect(res2.statusCode).toEqual(201);
    expect(res2.body).toHaveProperty('message', 'Data received');
    expect(res3.statusCode).toEqual(200);
  }, 10000);

  it('should handle varying response types', async () => {
    const jsonRes = await retryRequest(() => request(`http://localhost:${port}`).get('/data/json'));
    const textRes = await retryRequest(() => request(`http://localhost:${port}`).get('/data/text'));
    const htmlRes = await retryRequest(() => request(`http://localhost:${port}`).get('/data/html'));

    expect(jsonRes.statusCode).toEqual(200);
    expect(jsonRes.type).toEqual('application/json');
    expect(jsonRes.body).toHaveProperty('message', 'JSON Data');

    expect(textRes.statusCode).toEqual(200);
    expect(textRes.type).toEqual('text/plain');
    expect(textRes.text).toEqual('Text Data');

    expect(htmlRes.statusCode).toEqual(200);
    expect(htmlRes.type).toEqual('text/html');
    expect(htmlRes.text).toContain('<html>');
  }, 10000);

  it('should validate nested fields', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .post('/data')
        .send({ nested: { level1: { level2: 'Nested Field' } } })
    );
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Data received');
    expect(res.body.nested).toHaveProperty('level1.level2', 'Nested Field');
  }, 10000);

  it('should handle file uploads with metadata', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .post('/upload')
        .field('metadata', JSON.stringify({ author: 'John Doe', date: '2024-06-13' }))
        .attach('data', Buffer.from('File Content with Metadata'), 'testfile.txt')
    );
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'File uploaded');
    expect(res.body).toHaveProperty('metadata', { author: 'John Doe', date: '2024-06-13' });
    expect(res.body).toHaveProperty('data', 'File Content with Metadata');
  }, 10000);

  it('should handle base64 encoded data', async () => {
    const base64Data = Buffer.from('Base64 Encoded Data').toString('base64');
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .post('/data')
        .send({ data: base64Data })
    );
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Data received');
    expect(res.body).toHaveProperty('data', base64Data);
  }, 10000);

  it('should handle complex query parameters', async () => {
    const res = await retryRequest(() =>
      request(`http://localhost:${port}`)
        .get('/data/query')
        .query({ filter: 'test', sort: 'desc', limit: 10 })
    );
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Query received');
    expect(res.body).toHaveProperty('query', { filter: 'test', sort: 'desc', limit: 10 });
  }, 10000);
});

export default server;
