module.exports = () => {
  process.env.NODE_ENV = 'test';

 
  global.console = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };

 
  const jestExtended = require('jest-extended');
  expect.extend(jestExtended);

  
  jest.mock('some-module', () => {
    return {
      someMethod: jest.fn().mockReturnValue('mocked value'),
    };
  });


  beforeEach(() => {
    jest.clearAllMocks();
  });

  
  global.testUser = {
    id: 1,
    name: 'Test User',
    email: 'testuser@example.com',
  };


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
