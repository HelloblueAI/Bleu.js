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
const NodeEnvironment = require('jest-environment-node').TestEnvironment;
const { TextEncoder, TextDecoder } = require('util');
const pkg = require('./package.json');

class CustomEnvironment extends NodeEnvironment {
  constructor(config, context) {

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


    this.testPath = testConfig.testPath;
    this.projectConfig = testConfig.projectConfig;
    this.globalConfig = testConfig.globalConfig;
    this.testEnvironmentOptions = testConfig.projectConfig.testEnvironmentOptions;
  }

  async setup() {
    await super.setup();


    this.global.TextEncoder = TextEncoder;
    this.global.TextDecoder = TextDecoder;
    this.global.ArrayBuffer = ArrayBuffer;
    this.global.Uint8Array = Uint8Array;


    this.global.__BLEUJS_VERSION__ = this.testEnvironmentOptions.projectVersion;
    this.global.__BLEUJS_NAME__ = this.testEnvironmentOptions.projectName;


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


    Object.assign(this.global, {
      isTestEnvironment: true,
      testPath: this.testPath,
      projectRoot: process.cwd()
    });
  }

  async teardown() {
    try {

      if (this.global.gc) {
        this.global.gc();
      }
      await super.teardown();
    } catch (error) {
      console.error('Error during environment teardown:', error);

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


  runInEnvironment(fn) {
    return fn.call(this.global);
  }
}

module.exports = CustomEnvironment;
