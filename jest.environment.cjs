// jest.environment.cjs
const NodeEnvironment = require('jest-environment-node').TestEnvironment;
const { TextEncoder, TextDecoder } = require('util');
const pkg = require('./package.json');

class CustomEnvironment extends NodeEnvironment {
  constructor(config, context) {
    // Ensure config is properly initialized with test environment options
    const testConfig = {
      projectConfig: {
        testEnvironmentOptions: {
          url: 'http://localhost',
          projectName: pkg.name,
          projectVersion: pkg.version,
          ...config?.projectConfig?.testEnvironmentOptions
        },
        customExportConditions: ['node', 'node-addons'],
        ...config?.projectConfig
      },
      globalConfig: {
        ...config?.globalConfig
      },
      testPath: config?.testPath
    };

    super(testConfig, context);

    // Store configurations
    this.testPath = testConfig.testPath;
    this.projectConfig = testConfig.projectConfig;
    this.globalConfig = testConfig.globalConfig;
    this.testEnvironmentOptions = testConfig.projectConfig.testEnvironmentOptions;
  }

  async setup() {
    await super.setup();

    // Set up global objects
    this.global.TextEncoder = TextEncoder;
    this.global.TextDecoder = TextDecoder;
    this.global.ArrayBuffer = ArrayBuffer;
    this.global.Uint8Array = Uint8Array;

    // Set up project info globals
    this.global.__BLEUJS_VERSION__ = this.testEnvironmentOptions.projectVersion;
    this.global.__BLEUJS_NAME__ = this.testEnvironmentOptions.projectName;

    // Set up process.env
    if (!this.global.process) {
      this.global.process = {};
    }

    this.global.process.env = {
      ...process.env,
      NODE_ENV: 'test',
      JEST_WORKER_ID: process.env.JEST_WORKER_ID || '1',
      BLEUJS_VERSION: pkg.version,
      BLEUJS_NAME: pkg.name
    };

    // Add custom globals for test environment
    Object.assign(this.global, {
      isTestEnvironment: true,
      testPath: this.testPath,
      projectRoot: process.cwd()
    });
  }

  async teardown() {
    try {
      // Clean up any test-specific resources
      if (this.global.gc) {
        this.global.gc();
      }
      await super.teardown();
    } catch (error) {
      console.error('Error during environment teardown:', error);
      // Continue with teardown even if there's an error
    }
  }

  getVmContext() {
    return super.getVmContext();
  }

  handleTestEvent(event) {
    if (process.env.DEBUG) {
      console.log(`Test event: ${event.name}`);
    }
  }

  // Add custom methods for test environment
  runInEnvironment(fn) {
    return fn.call(this.global);
  }
}

module.exports = CustomEnvironment;
