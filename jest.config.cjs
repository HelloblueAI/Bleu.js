//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.

const path = require('path');
const pkg = require('./package.json');

module.exports = {
  rootDir: '.',

  testEnvironment: path.resolve(__dirname, 'jest.environment.cjs'),


  
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
        expand: true,
        hideIcon: false,
        testCommand: 'pnpm test',
        devCommand: 'pnpm dev',
        darkTheme: true,
        enableMerge: true,
        inlineSource: true,
        logo: path.resolve(__dirname, 'logo.png'),
        customInfos: [
          { title: 'Project', value: pkg.name },
          { title: 'Version', value: pkg.version },
          { title: 'Date', value: new Date().toISOString() },
          { title: 'Environment', value: process.env.NODE_ENV || 'test' },
        ],
        automaticallyOpen: true,
      },
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
        reportTestSuiteErrors: true,
      },
    ],
  ],

  moduleNameMapper: {
    'node:crypto': '<rootDir>/src/node-shims/crypto.js',
    crypto: '<rootDir>/src/node-shims/crypto.js',
    'node:fs': '<rootDir>/src/node-shims/fs.js',
    'node:net': '<rootDir>/src/node-shims/net.js',
    'node:events': require.resolve('events'),
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
  },

  transform: {
    '^.+\\.m?[tj]sx?$': [
      'babel-jest',
      {
        presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
      },
    ],
  },

  transformIgnorePatterns: [
    'node_modules/(?!(mongoose|express|body-parser|supertest|superagent|formidable|mongodb-memory-server)/.*)',
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
        '/tests/egg.test.js',
      ],
    },
    {
      displayName: 'test',
      testEnvironment: './jest.environment.cjs',
      testMatch: [
        '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/backend/tests/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/frontend/tests/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/**/__tests__/**/*.test.{js,jsx,ts,tsx}',
      ],
      testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '/coverage/',
        '/.pnpm/',
        '/venv/',
        '/eggs-generator/__tests__/index.test.js',
        '/tests/egg.test.js',
      ],
      moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
      coveragePathIgnorePatterns: [
        'node_modules',
        'test-config',
        'interfaces',
        'jestGlobalMocks.ts',
        '.module.ts',
        '<rootDir>/src/app/main.ts',
        '.mock.ts',
      ],
      coverageThreshold: {
        global: {
          statements: 95,
          branches: 90,
          functions: 90,
          lines: 95,

        },
        './src/core/': {
          statements: 98,
          branches: 95,
          functions: 95,
          lines: 98,

        },
        './src/utils/': {
          statements: 95,
          branches: 90,
          functions: 90,
          lines: 95,

        },
      },
    },
  ],


  maxWorkers: '85%',
  testTimeout: 120000,
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
    ['jest-watch-suspend', { 'key-for-resume': 'r', 'key-for-suspend': 's' }],
  ],


  globals: {
    __DEV__: true,
    __TEST__: true,
    __VERSION__: pkg.version,
    __PROJECT__: pkg.name,
  },


  verbose: true,
  bail: 1,
  cacheDirectory: '.jest-cache',
  errorOnDeprecated: true,
  notify: true,
  notifyMode: 'failure-change',


  displayName: {
    name: pkg.name,
    color: 'blue',
  },
};
