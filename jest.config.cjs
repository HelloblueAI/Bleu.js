module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost/',
    resources: 'usable',
    runScripts: 'dangerously',
  },

  transform: {
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json', diagnostics: false, isolatedModules: true }],
  },

  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],

  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/backend/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/frontend/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/core-engine/tests/**/*.test.{js,jsx,ts,tsx}',
  ],

  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/reports/',
    '<rootDir>/build/',
    '<rootDir>/scripts/',
    '<rootDir>/public/',
  ],

  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'backend/**/*.{js,jsx,ts,tsx}',
    'frontend/**/*.{js,jsx,ts,tsx}',
    'core-engine/**/*.{js,jsx,ts,tsx}',
    'language-plugins/**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/coverage/**',
    '!**/reports/**',
    '!**/tests/**',
    '!**/__mocks__/**',
    '!**/*.config.{js,ts}',
    '!**/scripts/**',
    '!**/public/**',
    '!**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text', 'lcov'],

  projects: [
    {
      displayName: 'lint',
      runner: 'jest-runner-eslint',
      testMatch: ['<rootDir>/**/*.{js,jsx,ts,tsx}'],
      testPathIgnorePatterns: ['/node_modules/', '/dist/', '/reports/'],
    },
    {
      displayName: 'test',
      testEnvironment: 'jsdom',
      testEnvironmentOptions: {
        resources: 'usable',
      },
      testMatch: [
        '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/backend/tests/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/frontend/tests/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/core-engine/tests/**/*.test.{js,jsx,ts,tsx}',
      ],
      testPathIgnorePatterns: ['/node_modules/', '/dist/', '/reports/'],
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
        pageTitle: 'Bleu.js Test Report',
        hideIcon: false,
        customInfos: [
          { title: 'Project', value: 'Bleu.js' },
          { title: 'Version', value: '1.0.35' },
        ],
        enableMergeData: true,
        includeFailureMsg: true,
      },
    ],
    [
      'jest-stare',
      {
        resultDir: './reports/jest-stare',
        reportTitle: 'Bleu.js Stare Report',
        coverageLink: '../coverage/lcov-report/index.html',
        clear: true,
      },
    ],
  ],

  verbose: true,
};
