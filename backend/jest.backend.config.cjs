module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'json', 'node'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  testMatch: ['**/backend/tests/**/*.test.js'],
  coverageDirectory: './coverage/',
  collectCoverage: true,
  collectCoverageFrom: [
    '**/backend/services/**/*.js',
    '**/backend/routes/**/*.js',
    '**/backend/models/**/*.js',
    '!**/node_modules/**',
    '!**/backend/tests/**',
  ],
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './html-report',
        filename: 'report.html',
        expand: true,
      },
    ],
  ],
  verbose: true,
  transformIgnorePatterns: ['/node_modules/'],
  testTimeout: 30000,
  globalSetup: './globalSetup.js',
  globalTeardown: './globalTeardown.js',
  testSequencer: './testSequencer.js',
};
