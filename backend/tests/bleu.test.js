/* eslint-env node, jest */
const request = require('supertest');

const app = require('../index');

describe('Bleu.js Test Suite', () => {
  let server;

  beforeAll((done) => {
    server = app.listen(4004, () => {
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

  it('should pass a basic test', async () => {
    const response = await request(app).get('/api/basic-test');
    expect(response.statusCode).toBe(200);
  });
});
