module.exports = {
  
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],


  testEnvironment: 'jsdom',
  testEnvironmentOptions: {},


  transform: {
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.tsx?$': 'ts-jest',
  },


  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],


  testMatch: [
    '<rootDir>/tests/**/*.test.(js|jsx|ts|tsx)',
    '<rootDir>/backend/tests/**/*.test.(js|jsx|ts|tsx)',
  ],


  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '<rootDir>/reports/html-report/jest-html-reporters-attach/index/result.js',
    '<rootDir>/reports/jest-html-reporters-attach/test-report/result.js',
    '<rootDir>/reports/jest-html-reporters-attach/test-report/index.js',
    '<rootDir>/backend/tests/testSequencer.test.js',
    '<rootDir>/backend/tests/apiRoutes.test.js',
    '<rootDir>/backend/tests/seedDatabase.test.js',
    '<rootDir>/backend/tests/apiController.test.js',
    '<rootDir>/backend/tests/aiService.test.js',
    '<rootDir>/backend/tests/apiGenerateEgg.test.js',
    '<rootDir>/backend/tests/decisionTree.test.js',
    '<rootDir>/backend/tests/bleu.test.js',
    '<rootDir>/backend/tests/aiTests.test.js',
  ],

  // Coverage collection settings
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'backend/**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text', 'lcov'],

  // Global configuration for ts-jest
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
      diagnostics: false, // Disable diagnostics for better performance
    },
  },

  // Project-specific configurations
  projects: [
    {
      displayName: 'lint',
      runner: 'jest-runner-eslint',
      testMatch: ['<rootDir>/**/*.{js,jsx,ts,tsx}'],
      testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '<rootDir>/reports/html-report/jest-html-reporters-attach/index/result.js',
        '<rootDir>/reports/jest-html-reporters-attach/test-report/result.js',
        '<rootDir>/reports/jest-html-reporters-attach/test-report/index.js',
      ],
    },
    {
      displayName: 'test',
      testEnvironment: 'jsdom',
      testEnvironmentOptions: {},
      testMatch: [
        '<rootDir>/tests/**/*.test.(js|jsx|ts|tsx)',
        '<rootDir>/backend/tests/**/*.test.(js|jsx|ts|tsx)',
      ],
      testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '<rootDir>/reports/html-report/jest-html-reporters-attach/index/result.js',
        '<rootDir>/reports/jest-html-reporters-attach/test-report/result.js',
        '<rootDir>/reports/jest-html-reporters-attach/test-report/index.js',
        '<rootDir>/backend/tests/testSequencer.test.js',
        '<rootDir>/backend/tests/apiRoutes.test.js',
        '<rootDir>/backend/tests/seedDatabase.test.js',
        '<rootDir>/backend/tests/apiController.test.js',
        '<rootDir>/backend/tests/aiService.test.js',
        '<rootDir>/backend/tests/apiGenerateEgg.test.js',
        '<rootDir>/backend/tests/decisionTree.test.js',
        '<rootDir>/backend/tests/bleu.test.js',
        '<rootDir>/backend/tests/aiTests.test.js',
      ],
    },
  ],


  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],


  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './reports',
        filename: 'test-report.html',
        expand: true,
        pageTitle: 'Test Report',
      },
    ],
  ],


  verbose: true,
};
