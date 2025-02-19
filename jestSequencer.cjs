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
const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  /**
   * Determine test order based on dependencies and priorities
   */
  sort(tests) {
    const copyTests = Array.from(tests);


    const getTestPriority = (testPath) => {
      if (testPath.includes('unit')) return 1;
      if (testPath.includes('integration')) return 2;
      if (testPath.includes('e2e')) return 3;
      return 4;
    };


    const isBleuTest = (testPath) => {
      const testName = testPath.toLowerCase();
      return (
        testName.includes('bleu') ||
        testName.includes('egg') ||
        testName.includes('hen')
      );
    };


    return copyTests.sort((testA, testB) => {
      const pathA = testA.path;
      const pathB = testB.path;


      const isBleuA = isBleuTest(pathA);
      const isBleuB = isBleuTest(pathB);
      if (isBleuA !== isBleuB) {
        return isBleuA ? -1 : 1;
      }


      const priorityA = getTestPriority(pathA);
      const priorityB = getTestPriority(pathB);
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      
      return pathA.localeCompare(pathB);
    });
  }

  /**
   * Override for fail-fast functionality
   */
  async allFailedTests(tests) {
    const failedTests = tests.filter(test => test.status === 'failed');
    return failedTests.length > 0 ? failedTests : tests;
  }

  /**
   * Get test runtime data
   */
  getCacheKey(testPath) {
    const pkg = require('./package.json');
    return `${pkg.name}-${pkg.version}-${testPath}`;
  }
}

module.exports = CustomSequencer;
