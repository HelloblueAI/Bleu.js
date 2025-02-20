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

'use strict';

const { teardown: teardownPuppeteer } = require('jest-environment-puppeteer');
const { teardownDatabase } = require('../path/to/your/db/teardown');

/**
 * Global teardown function for Jest tests.
 * Cleans up Puppeteer environment and database.
 * @param {Object} globalConfig - Jest global configuration object.
 */
async function globalTeardown(globalConfig) {
  try {
    console.info('🟡 Starting global teardown...');

    await teardownPuppeteer(globalConfig);
    console.info('✅ Puppeteer environment cleaned up.');

    await teardownDatabase();
    console.info('✅ Database teardown completed.');

    // Remove global environment variables
    delete process.env.TEST_GLOBAL_VARIABLE;

    console.info('🛑 Global teardown completed successfully.');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    process.exit(1); // Exit process if teardown fails
  }
}

module.exports = globalTeardown;
