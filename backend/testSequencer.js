const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    // Prioritize specific tests if needed
    const prioritizedTests = tests.filter(test => 
      test.path.includes('priority.test.js')
    );

    const otherTests = tests.filter(test => 
      !test.path.includes('priority.test.js')
    );

    // Sort by file size
    prioritizedTests.sort((a, b) => a.path.length - b.path.length);
    otherTests.sort((a, b) => a.path.length - b.path.length);

    return [...prioritizedTests, ...otherTests];
  }
}

module.exports = CustomSequencer;
