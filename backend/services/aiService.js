// backend/services/aiService.js
const logger = require('../src/utils/logger');

class AIService {
  doSomething() {
    logger.info('Doing something');
  }
}

module.exports = AIService;
