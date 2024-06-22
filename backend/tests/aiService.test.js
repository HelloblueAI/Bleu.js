/* eslint-env node, jest */
const request = require('supertest');

const app = require('../index');

describe('AIService API', () => {
  let server;

  beforeAll((done) => {
    server = app.listen(4006, () => {
      global.agent = request.agent(server);
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    global.console = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    };
  });

  it('should respond with 200 for /api/aiService', async () => {
    const response = await request(app)
      .post('/api/aiService')
      .send({ input: 'test input' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('result');
  });
});
