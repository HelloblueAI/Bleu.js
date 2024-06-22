/* eslint-env node, jest */

const { Test } = require('@jest/test-sequencer');

const CustomSequencer = require('../services/CustomSequencer');

describe('Custom Sequencer Tests', () => {
  it('should sequence tests correctly', () => {
    const sequencer = new CustomSequencer();
    const tests = [new Test('test1'), new Test('test2')];
    const sequencedTests = sequencer.sort(tests);
    expect(sequencedTests).toEqual(tests);
  });
});
