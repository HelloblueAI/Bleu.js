'use strict';

var _interopRequireDefault = require('@babel/runtime-corejs3/helpers/interopRequireDefault');
var _sort = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/instance/sort'),
);
var _stringify = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/json/stringify'),
);
/* eslint-env node */
const { writeFileSync } = require('fs');
class CustomSequencer {
  sort(tests) {
    return (0, _sort.default)(tests).call(tests, (a, b) => {
      const priorities = {
        critical: 1,
        high: 2,
        normal: 3,
      };
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
    var _context;
    const sortedTests = (0, _sort.default)((_context = this)).call(
      _context,
      tests,
    );
    const results = [];
    for (const test of sortedTests) {
      const result = await test.run();
      results.push(result);
    }
    return results;
  }
  logResults(results) {
    writeFileSync('test-results.log', (0, _stringify.default)(results));
  }
}
module.exports = CustomSequencer;
