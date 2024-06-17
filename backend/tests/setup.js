const axios = require('axios');
const dotenv = require('dotenv');
const jestExtended = require('jest-extended');
const { faker } = require('@faker-js/faker');
const MockDate = require('mockdate');

dotenv.config();

expect.extend(jestExtended);

global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

global.faker = faker;

global.axios = axios.create({
  baseURL: 'http://localhost:8085',  
});

MockDate.set('2024-01-01');

beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.resetAllMocks();
  MockDate.reset();
});
