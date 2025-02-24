import logger from '../utils/logger.mjs';

class Bleu {
  /**
   * Manages dependencies and logs details.
   * @param {Array} dependencies - List of dependencies with name and version.
   */
  manageDependencies(dependencies = []) {
    if (!Array.isArray(dependencies)) {
      logger.error('❌ Invalid dependencies list provided.');
      throw new Error('Dependencies must be an array.');
    }

    if (dependencies.length === 0) {
      logger.warn('⚠️ No dependencies to manage.');
      return;
    }

    dependencies.forEach(({ name, version }) => {
      if (!name || !version) {
        logger.error('❌ Missing dependency details.');
        return;
      }
      logger.info(`📦 Managing dependency: ${name}@${version}`);
    });

    logger.info('✅ Dependency management completed.');
  }
}

// Export as an ES Module
export default Bleu;
