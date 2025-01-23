/* eslint-env node */
const logger = require('../logger');

class Bleu {
  manageDependencies(dependencies) {
    dependencies.forEach((dependency) => {
      logger.info(
        `Managing dependency: ${dependency.name}@${dependency.version}`
      );
    });
  }
}

module.exports = Bleu;
