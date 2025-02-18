module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/__mocks__/'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js'
  ],
  moduleDirectories: [
    'node_modules',
    '<rootDir>'
  ],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  verbose: true,
  roots: ['<rootDir>'],
  testMatch: [
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ]
};
