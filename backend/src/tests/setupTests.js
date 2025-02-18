'use strict';

/* eslint-env jest */

afterEach(() => {
  if (global.server) {
    global.server.close(() => {
      console.log('Server closed after test suite.');
    });
  }
  jest.restoreAllMocks();
  jest.resetModules();
  jest.clearAllMocks();
  jest.clearAllTimers();
});
