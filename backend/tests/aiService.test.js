const logger = require('../src/utils/logger');
const AIService = require('../services/aiService');
let aiService;

describe('AIService', () => {
  beforeAll(() => {
    aiService = new AIService();
  });

  it('should do something', () => {
    const spy = jest.spyOn(logger, 'info');
    aiService.doSomething();
    expect(spy).toHaveBeenCalled();
  });
});
