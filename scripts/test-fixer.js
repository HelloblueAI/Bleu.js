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
import { execSync } from 'child_process';
import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Utility functions
const readJsonFile = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    console.error(`Error reading JSON file ${path}:`, error);
    return null;
  }
};

const writeJsonFile = (path, data) => {
  try {
    writeFileSync(path, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing JSON file ${path}:`, error);
    return false;
  }
};

const execCommand = (command, options = { stdio: 'inherit' }) => {
  try {
    execSync(command, options);
    return true;
  } catch (error) {
    console.error(`Error executing command "${command}":`, error);
    return false;
  }
};

// Configuration management
const fixMongoDBMemoryServer = () => {
  const config = {
    binary: {
      version: '6.0.12',
      skipMD5: true
    },
    autoStart: false,
    instance: {}
  };

  return writeJsonFile(
    join(process.cwd(), 'mongodb-memory-server-config.js'),
    config
  );
};

// Jest configuration
const fixJestMocks = () => {
  const mockTemplate = `
import { jest } from '@jest/globals';

const createMock = (name) => {
  const mock = jest.fn();
  mock.mockName(name);
  return mock;
};

global.beforeEach(() => {
  jest.resetModules();
});

jest.mock('./src/utils/logger', () => ({
  info: createMock('logger.info'),
  error: createMock('logger.error'),
  debug: createMock('logger.debug')
}));
`;

  try {
    writeFileSync(join(process.cwd(), 'jest.setup.js'), mockTemplate);
    return true;
  } catch (error) {
    console.error('Error creating Jest mocks:', error);
    return false;
  }
};

// Node.js polyfills
const createNodePolyfills = () => {
  const polyfills = {
    'async_hooks.js': `
      export class AsyncLocalStorage {
        run(store, callback) { return callback(); }
        getStore() { return null; }
      }
      export const createHook = () => ({ enable: () => {}, disable: () => {} });
    `,
    'fs.js': `
      import fs from 'fs';
      export default fs;
    `,
    'net.js': `
      import net from 'net';
      export default net;
    `
  };

  try {
    const nodeShimsDir = join(process.cwd(), 'src', 'node-shims');
    if (!existsSync(nodeShimsDir)) {
      mkdirSync(nodeShimsDir, { recursive: true });
    }

    Object.entries(polyfills).forEach(([file, content]) => {
      writeFileSync(join(nodeShimsDir, file), content.trim());
    });
    return true;
  } catch (error) {
    console.error('Error creating Node.js polyfills:', error);
    return false;
  }
};

// Package.json management
const updatePackageJson = async () => {
  const packageJsonPath = join(process.cwd(), 'package.json');
  const packageJson = readJsonFile(packageJsonPath);

  if (!packageJson) return false;

  packageJson.scripts = {
    ...packageJson.scripts,
    "test": "cross-env NODE_ENV=test jest --config jest.config.js --runInBand --detectOpenHandles --forceExit",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
    "test:update": "jest -u",
    "test:clear": "jest --clearCache"
  };

  // Add necessary devDependencies if they don't exist
  packageJson.devDependencies = {
    ...packageJson.devDependencies,
    "@babel/preset-env": "^7.24.0",
    "mongodb-memory-server": "^9.1.6",
    "@types/jest": "^29.5.12",
    "babel-jest": "^29.7.0",
    "cross-env": "^7.0.3"
  };

  return writeJsonFile(packageJsonPath, packageJson);
};

// Jest configuration update
const updateJestConfig = () => {
  const config = {
    moduleNameMapper: {
      '^node:(.*)$': '<rootDir>/src/node-shims/$1.js'
    },
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testTimeout: 30000,
    modulePathIgnorePatterns: ['<rootDir>/coverage/'],
    transform: {
      '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['@babel/preset-env'] }]
    },
    collectCoverageFrom: [
      'src/**/*.{js,jsx,ts,tsx}',
      '!src/**/*.d.ts',
      '!src/**/index.{js,ts}',
      '!src/**/types.{js,ts}'
    ],
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  };

  try {
    writeFileSync(
      join(process.cwd(), 'jest.config.js'),
      `export default ${JSON.stringify(config, null, 2)};`
    );
    return true;
  } catch (error) {
    console.error('Error updating Jest config:', error);
    return false;
  }
};

// Dependency installation
const installDependencies = () => {
  console.log('Installing dependencies...');
  return execCommand('pnpm install');
};

// Main execution
const main = async () => {
  console.log('🔧 Fixing test suite...');

  const steps = [
    { name: 'Installing dependencies', fn: installDependencies },
    { name: 'Creating Node.js polyfills', fn: createNodePolyfills },
    { name: 'Updating Jest configuration', fn: updateJestConfig },
    { name: 'Fixing Jest mocks', fn: fixJestMocks },
    { name: 'Updating package.json', fn: updatePackageJson },
    { name: 'Configuring MongoDB Memory Server', fn: fixMongoDBMemoryServer }
  ];

  let success = true;
  for (const step of steps) {
    console.log(`\n📝 ${step.name}...`);
    const result = await step.fn();
    if (!result) {
      console.error(`❌ Failed at step: ${step.name}`);
      success = false;
      break;
    }
  }

  if (success) {
    console.log('\n✨ All fixes applied successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: pnpm test');
    console.log('2. Check test coverage: pnpm test:coverage');
    console.log('3. Debug failing tests: pnpm test:debug');
  } else {
    console.error('\n❌ Fix process failed. Please check the errors above.');
    process.exit(1);
  }
};

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
