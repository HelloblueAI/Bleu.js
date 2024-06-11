module.exports = () => {
  process.env.NODE_ENV = 'test';

  // Mock console methods to avoid cluttering test output
  global.console = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };

  // Extend Jest matchers with powerful matchers from jest-extended
  const jestExtended = require('jest-extended');
  expect.extend(jestExtended);

  // Mocking common modules or utilities
  jest.mock('some-module', () => {
    return {
      someMethod: jest.fn().mockReturnValue('mocked value'),
    };
  });

  // Clear all mocks before each test to ensure isolation
  beforeEach(() => {
    jest.clearAllMocks();
  });

  
  global.testUser = {
    id: 1,
    name: 'Test User',
    email: 'testuser@example.com',
  };

  // Use a library like faker.js for generating random data
  const faker = require('faker');
  global.faker = faker;

  // Mock date and time to control time-based tests
  const MockDate = require('mockdate');
  MockDate.set('2024-01-01');

  
  afterAll(() => {
    jest.resetAllMocks();
    MockDate.reset();
  });

  
  global.someGlobalFunction = jest.fn().mockReturnValue('some value');

  // Set up axios for HTTP request mocking
  const axios = require('axios');
  global.axios = axios.create({
    baseURL: 'http://localhost:3000',
  });
};
