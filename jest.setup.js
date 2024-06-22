/* eslint-env jest */

jest.setTimeout(30000);

beforeAll(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({}),
    }),
  );
});

afterAll(() => {
  delete global.fetch;
});

beforeEach(() => {
  global.console = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.resetModules();
  jest.clearAllMocks();
  jest.clearAllTimers();
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
