// jest.config.cjs
const { FlatCompat } = require('@eslint/eslintrc');
const compat = new FlatCompat();

module.exports = {
  setupFilesAfterEnv: ['./jest.setup.js'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.vue$': 'vue-jest',
  },
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'vue'],
  testMatch: ['**/tests/**/*.test.(js|jsx|ts|tsx)'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx,vue}',
    '!src/**/*.d.ts',
    '!src/**/node_modules/**',
    '!src/**/vendor/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text', 'lcov', 'clover'],
  globals: {
    'vue-jest': {
      babelConfig: true,
    },
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  projects: [
    {
      displayName: 'lint',
      runner: 'jest-runner-eslint',
      testMatch: ['<rootDir>/**/*.{js,jsx,ts,tsx,vue}'],
    },
    {
      displayName: 'test',
      testMatch: ['<rootDir>/**/*.test.{js,jsx,ts,tsx}'],
    },
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};

// ESLint configuration
module.exports.eslint = [
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx', '**/*.cjs'],
    languageOptions: {
      parser: require('@babel/eslint-parser'),
      parserOptions: {
        requireConfigFile: false,
        ecmaVersion: 2021,
        sourceType: 'module',
      },
    },
    rules: {
      'no-console': 'warn',
      'no-debugger': 'warn',
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      indent: ['error', 2],
      'linebreak-style': ['error', 'unix'],
      eqeqeq: ['error', 'always'],
      'no-trailing-spaces': 'error',
      'space-before-blocks': 'error',
      'keyword-spacing': ['error', { before: true, after: true }],
      'space-infix-ops': 'error',
      'comma-spacing': ['error', { before: false, after: true }],
      'key-spacing': ['error', { beforeColon: false, afterColon: true }],
      'space-unary-ops': ['error', { words: true, nonwords: false }],
    },
  },
  {
    files: ['**/*.vue'],
    plugins: {
      vue: require('eslint-plugin-vue'),
    },
    languageOptions: {
      parser: require('vue-eslint-parser'),
      parserOptions: {
        parser: require('@babel/eslint-parser'),
        ecmaVersion: 2021,
        sourceType: 'module',
      },
    },
    rules: {
      'vue/no-unused-vars': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  ...compat.extends('plugin:vue/vue3-recommended'),
  ...compat.extends('plugin:prettier/recommended'),
];
