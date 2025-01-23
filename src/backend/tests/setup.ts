// test/setup.ts
import { vi } from 'vitest';

// Global mocking setup can be added here, if needed.
vi.mock('console', () => ({
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
}));

// Example: Set up any global test configurations or variables.
console.log('Test setup file executed.');
