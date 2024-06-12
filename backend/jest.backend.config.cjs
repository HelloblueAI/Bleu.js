module.exports = {
  testEnvironment: 'node',
  transform: {
      '^.+\\.js$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'json', 'node'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  coverageDirectory: './coverage/',
  collectCoverage: true,
  collectCoverageFrom: [
      '**/services/**/*.js',
      '**/routes/**/*.js',
      '**/models/**/*.js',
      '!**/node_modules/**',
      '!**/tests/**',
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
};
