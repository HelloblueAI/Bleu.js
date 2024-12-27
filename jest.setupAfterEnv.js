// Jest setup file executed after the test environment is set up

// Extend Jest matchers
import '@testing-library/jest-dom/extend-expect';
import jest from 'jest-mock';

// Mock global functions or objects, if necessary
global.console.error = jest.fn((message) => {
  throw new Error(`Console error: ${message}`);
});

global.console.warn = jest.fn((message) => {
  throw new Error(`Console warn: ${message}`);
});

// Configure default timeout for tests (optional)
jest.setTimeout(30000); // 30 seconds
