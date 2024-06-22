/* eslint-env node, jest */
const request = require('supertest');

const app = require('../index');

describe('Seed Database', () => {
  let server;

  beforeAll((done) => {
    server = app.listen(4005, () => {
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

  it('should seed database successfully', async () => {
    const response = await request(app).post('/api/seedDatabase');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty(
      'message',
      'Database seeded successfully',
    );
  });
});
