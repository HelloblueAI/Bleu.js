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

/* eslint-env node */
const { writeFileSync } = require('fs');

class CustomSequencer {
  /**
   * Sorts test files based on priority.
   * Falls back to natural order if priority is not defined.
   * @param {Array} tests - Array of test objects
   * @returns {Array} Sorted test array
   */
  sort(tests) {
    const priorities = {
      critical: 1,
      high: 2,
      normal: 3,
    };

    return tests.sort((a, b) => {
      const priorityA = priorities[a.priority] || 4; // Default lowest priority
      const priorityB = priorities[b.priority] || 4;
      return priorityA - priorityB;
    });
  }

  /**
   * Retries failed tests up to a defined retry limit.
   * @param {Array} tests - Array of tests
   */
  async retry(tests) {
    const retryLimit = 2;

    for (let attempt = 1; attempt <= retryLimit; attempt++) {
      console.info(`🔄 Retry attempt ${attempt} for failed tests...`);

      for (const test of tests) {
        try {
          await test.run();
          console.info(`✅ Test retried successfully: ${test.path}`);
        } catch (error) {
          console.error(`❌ Test retry failed: ${test.path}`, error);
        }
      }
    }
  }

  /**
   * Executes all tests, sorting them first by priority.
   * @param {Array} tests - Array of tests
   * @returns {Array} Results of all executed tests
   */
  async run(tests) {
    try {
      console.info('🚀 Running test suite...');

      const sortedTests = this.sort(tests);
      const results = [];

      for (const test of sortedTests) {
        try {
          const result = await test.run();
          results.push(result);
        } catch (error) {
          console.error(`❌ Test failed: ${test.path}`, error);
        }
      }

      return results;
    } catch (error) {
      console.error('❌ Test execution error:', error);
      return [];
    }
  }

  /**
   * Logs test results to a file.
   * @param {Array} results - Array of test results
   */
  logResults(results) {
    try {
      const logData = JSON.stringify(results, null, 2);
      writeFileSync('test-results.log', logData, 'utf8');
      console.info('📄 Test results saved to test-results.log');
    } catch (error) {
      console.error('❌ Error writing test results:', error);
    }
  }
}

module.exports = CustomSequencer;
