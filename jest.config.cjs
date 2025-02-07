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
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
        diagnostics: false,
        isolatedModules: true,
        esModuleInterop: true,
      },
    ],
  },

  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node', 'mjs', 'cjs'],

  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/backend/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/frontend/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/core-engine/tests/**/*.test.{js,jsx,ts,tsx}',
  ],

  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/', '/reports/', '<rootDir>/build/', '<rootDir>/scripts/', '<rootDir>/public/'],

  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'backend/src/**/*.{js,jsx,ts,tsx}',
    'frontend/src/**/*.{js,jsx,ts,tsx}',
    'core-engine/src/**/*.{js,jsx,ts,tsx}',
    'language-plugins/src/**/*.{js,jsx,ts,tsx}',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text', 'lcov', 'json-summary'],

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
      testEnvironmentOptions: { resources: 'usable' },
      testMatch: [
        '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/backend/tests/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/frontend/tests/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/core-engine/tests/**/*.test.{js,jsx,ts,tsx}',
      ],
      testPathIgnorePatterns: ['/node_modules/', '/dist/', '/reports/'],
    },
  ],

  automock: false,
  resetMocks: true,
  clearMocks: true,

  maxWorkers: '80%',
  maxConcurrency: 5,
  slowTestThreshold: 3,
  forceExit: true,

  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],

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
