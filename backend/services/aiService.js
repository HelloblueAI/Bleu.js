const logger = require('../src/utils/logger');

class AIService {
  doSomething() {
    logger.info('Doing something');
  }
}

module.exports = AIService;
