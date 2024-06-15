import * as jestExtended from 'jest-extended';
import { faker } from '@faker-js/faker';
import MockDate from 'mockdate';
import axios from 'axios';

export default () => {
  process.env.NODE_ENV = 'test';

  global.console = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };

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

  global.faker = faker;

  // Mock date and time to control time-based tests
  MockDate.set('2024-01-01');

  afterAll(() => {
    jest.resetAllMocks();
    MockDate.reset();
  });

  global.someGlobalFunction = jest.fn().mockReturnValue('some value');

  // Set up axios for HTTP request mocking
  global.axios = axios.create({
    baseURL: 'http://localhost:3000',
  });
};
