/* eslint-env node, jest */
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
