
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
/* eslint-env node */
const { writeFileSync } = require('fs');

class CustomSequencer {
  sort(tests) {
    return tests.sort((a, b) => {
      const priorities = { critical: 1, high: 2, normal: 3 };
      return priorities[a.priority] - priorities[b.priority];
    });
  }

  async retry(tests) {
    const retryLimit = 2;
    for (let i = 0; i < retryLimit; i++) {
      for (const test of tests) {
        await test.run();
      }
    }
  }

  async run(tests) {
    const sortedTests = this.sort(tests);
    const results = [];
    for (const test of sortedTests) {
      const result = await test.run();
      results.push(result);
    }
    return results;
  }

  logResults(results) {
    writeFileSync('test-results.log', JSON.stringify(results));
  }
}

module.exports = CustomSequencer;
