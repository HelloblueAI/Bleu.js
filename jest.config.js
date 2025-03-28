/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.mjs'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^(\\.{1,2}/.*)\\.mjs$': '$1',
    '^(\\.{1,2}/.*)\\.ts$': '$1',
    '^(\\.{1,2}/.*)\\.tsx$': '$1'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.json'
    }],
    '^.+\\.(js|jsx|mjs)$': ['@swc/jest', {
      sourceMaps: true,
      module: {
        type: 'es6'
      },
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true,
          decorators: true,
          dynamicImport: true
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true
        },
        target: 'es2020'
      }
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@tensorflow/tfjs-node|@babel/runtime|@jest/globals)/)'
  ],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'mjs', 'cjs'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  },
  resolver: '<rootDir>/jest.resolver.cjs',
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: 'tsconfig.json'
    }
  },
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx,js,jsx}',
    '!src/**/*.spec.{ts,tsx,js,jsx}'
  ],
  moduleDirectories: ['node_modules', 'src'],
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/']
}; 