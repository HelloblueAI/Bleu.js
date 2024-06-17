// backend/tests/aiTests.test.js
const AIService = require('../services/aiService');
const logger = require('../src/utils/logger');

describe('AIService', () => {
  let aiService;

  beforeAll(() => {
    aiService = new AIService();
  });

  it('should do something', () => {
    const spy = jest.spyOn(logger, 'info');
    aiService.doSomething();
    expect(spy).toHaveBeenCalled();
  });
});
