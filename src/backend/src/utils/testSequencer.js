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
