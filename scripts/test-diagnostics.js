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
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Update Jest configuration with proper test environment options
const updateJestConfig = () => {
  const config = {
    testEnvironment: 'node',
    testEnvironmentOptions: {
      NODE_ENV: 'test'
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testTimeout: 30000,
    modulePathIgnorePatterns: ['<rootDir>/coverage/'],
    transform: {
      '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['@babel/preset-env'] }]
    },
    moduleNameMapper: {
      '^node:(.*)$': '<rootDir>/src/node-shims/$1.js'
    },
    extensionsToTreatAsEsm: ['.ts', '.tsx', '.jsx', '.js'],
    testRunner: 'jest-circus/runner',
    verbose: true,
    collectCoverage: true,
    coverageReporters: ['text', 'lcov', 'html'],
    coverageDirectory: 'coverage'
  };

  try {
    // Create jest.config.cjs (CommonJS format)
    writeFileSync(
      join(process.cwd(), 'jest.config.cjs'),
      `module.exports = ${JSON.stringify(config, null, 2)};`
    );

    // Create babel.config.cjs for proper transpilation
    const babelConfig = {
      presets: [
        ['@babel/preset-env', {
          targets: {
            node: 'current'
          },
          modules: 'auto'
        }]
      ],
      plugins: [
        '@babel/plugin-transform-modules-commonjs'
      ]
    };

    writeFileSync(
      join(process.cwd(), 'babel.config.cjs'),
      `module.exports = ${JSON.stringify(babelConfig, null, 2)};`
    );

    // Create .babelrc for additional settings
    const babelRcConfig = {
      "sourceType": "unambiguous",
      "presets": ["@babel/preset-env"],
      "plugins": ["@babel/plugin-transform-modules-commonjs"]
    };

    writeFileSync(
      join(process.cwd(), '.babelrc'),
      JSON.stringify(babelRcConfig, null, 2)
    );

    // Update package.json jest configuration
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

    packageJson.scripts = {
      ...packageJson.scripts,
      "test": "NODE_ENV=test jest --config jest.config.cjs --runInBand --detectOpenHandles --forceExit",
      "test:watch": "jest --watch --config jest.config.cjs",
      "test:coverage": "jest --coverage --config jest.config.cjs",
      "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand --config jest.config.cjs"
    };

    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    return true;
  } catch (error) {
    console.error('Error updating Jest configuration:', error);
    return false;
  }
};

// Install required dependencies with exact versions
const installDependencies = async () => {
  const dependencies = [
    '@babel/core@7.26.3',
    '@babel/preset-env@7.26.3',
    '@babel/plugin-transform-modules-commonjs@7.26.3',
    'babel-jest@29.7.0',
    'jest@29.7.0',
    'jest-circus@29.7.0',
    'jest-environment-node@29.7.0',
    'ts-jest@29.1.2',
    'mongodb-memory-server@9.1.6',
    '@types/jest@29.5.12'
  ];

  try {
    console.log('Installing test dependencies...');
    console.log('Running:', `pnpm add -D ${dependencies.join(' ')}`);

    // Clean up node_modules first
    console.log('Cleaning up node_modules...');
    execSync('rm -rf node_modules', { stdio: 'inherit' });

    // Install dependencies
    execSync(`pnpm add -D ${dependencies.join(' ')}`, {
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    return true;
  } catch (error) {
    console.error('Error installing dependencies:', error);
    console.error('Full error:', error.message);
    return false;
  }
};

// Main diagnostic function
const runDiagnostics = async () => {
  console.log('🔍 Running test diagnostics...\n');

  // Install dependencies first
  console.log('📦 Installing dependencies...');
  if (!await installDependencies()) {
    console.error('Failed to install dependencies');
    return;
  }

  // Update Jest configuration
  console.log('⚙️ Updating Jest configuration...');
  if (!updateJestConfig()) {
    console.error('Failed to update Jest configuration');
    return;
  }

  // Run tests
  console.log('\n▶️ Running tests...');
  try {
    execSync('pnpm test', { stdio: 'inherit' });
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Some tests failed.');
    console.error('Check the test output above for details.');
  }
};

// Run the diagnostics
runDiagnostics().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
