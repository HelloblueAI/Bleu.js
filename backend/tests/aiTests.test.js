/* eslint-env node, jest */
const AIService = require('../services/aiService');
const logger = require('../src/utils/logger');

describe('AIService', () => {
  let aiService;

  beforeAll(() => {
    aiService = new AIService();
  });

  it('should log info when doSomething is called', () => {
    const spy = jest.spyOn(logger, 'info');
    aiService.doSomething();
    expect(spy).toHaveBeenCalled();
  });
});
