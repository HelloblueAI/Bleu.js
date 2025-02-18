const path = require('path');
const pkg = require('./package.json');

module.exports = {
  rootDir: '.',

  testEnvironment: path.resolve(__dirname, 'jest.environment.cjs'),

  moduleNameMapper: {
    
    'node:crypto': '<rootDir>/src/node-shims/crypto.js',
    'crypto': '<rootDir>/src/node-shims/crypto.js',
    'node:fs': '<rootDir>/src/node-shims/fs.js',
    'node:net': '<rootDir>/src/node-shims/net.js',
    'node:events': require.resolve('events'),

    '^@/(.*)$': '<rootDir>/src/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1'
  },


  transform: {
    '^.+\\.m?[tj]sx?$': [
      'babel-jest',
      {
        presets: [['@babel/preset-env', { targets: { node: 'current' } }]]
      }
    ]
  },

  transformIgnorePatterns: [
    'node_modules/(?!(mongoose|express|body-parser|supertest|superagent|formidable|mongodb-memory-server)/.*)'
  ],
  setupFiles: ['./jest.node-globals.cjs'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  globalSetup: './jest.global-setup.cjs',
  globalTeardown: './jest.teardown.cjs',

  projects: [
    {
      displayName: 'lint',
      runner: 'jest-runner-eslint',
      testMatch: ['<rootDir>/**/*.{js,jsx,ts,tsx}'],
      testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '/reports/',
        '/coverage/',
        '/.pnpm/',
        '/venv/',
        '/eggs-generator/__tests__/index.test.js',
        '/tests/egg.test.js'
      ]
    },
    {
      displayName: 'test',
      testEnvironment: './jest.environment.cjs',
      testMatch: [
        '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/backend/tests/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/frontend/tests/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/**/__tests__/**/*.test.{js,jsx,ts,tsx}'
      ],
      testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '/coverage/',
        '/.pnpm/',
        '/venv/',
        '/eggs-generator/__tests__/index.test.js',
        '/tests/egg.test.js'
      ],
      coverageDirectory: 'coverage',
      collectCoverage: true,
      coverageReporters: ['text', 'lcov', 'html', 'json-summary', 'cobertura'],
      collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        'backend/src/**/*.{js,jsx,ts,tsx}',
        'frontend/src/**/*.{js,jsx,ts,tsx}',
        'eggs-generator/src/**/*.{js,jsx,ts,tsx}',
        '!**/node_modules/**',
        '!**/tests/**',
        '!**/__tests__/**',
        '!**/coverage/**',
        '!**/dist/**',
        '!**/*.d.ts',
        '!**/types/**',
        '!**/interfaces/**',
        '!**/constants/**',
        '!**/config/**'
      ],
      coverageThreshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 85,
          statements: 85
        }
      },
      reporters: [
        'default',
        [
          'jest-html-reporters',
          {
            publicPath: './coverage/html-report',
            filename: 'report.html',
            openReport: true,
            pageTitle: `${pkg.name} v${pkg.version} - Test Report`,
            includeConsoleLog: true,
            includeSuiteFailure: true,
            logo: path.resolve(__dirname, 'logo.png'),
            customInfos: [
              { title: 'Project', value: pkg.name },
              { title: 'Version', value: pkg.version },
              { title: 'Date', value: new Date().toISOString() }
            ]
          }
        ],
        [
          'jest-junit',
          {
            outputDirectory: './coverage',
            outputName: 'junit.xml',
            ancestorSeparator: ' › ',
            uniqueOutputName: false,
            suiteNameTemplate: '{filepath}',
            classNameTemplate: '{classname}',
            titleTemplate: '{title}',
            addFileAttribute: true,
            reportTestSuiteErrors: true
          }
        ]
      ]
    }
  ],
  maxWorkers: '50%',
  testTimeout: 60000,
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
    ['jest-watch-suspend', { 'key-for-resume': 'r', 'key-for-suspend': 's' }]
  ],
  globals: {
    __DEV__: true,
    __TEST__: true,
    __VERSION__: pkg.version,
    __PROJECT__: pkg.name
  },

  verbose: true,
  bail: 1,
  cacheDirectory: '.jest-cache',
  errorOnDeprecated: true,
  notify: true,
  notifyMode: 'failure-change'
}
