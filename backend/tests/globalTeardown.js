const { teardown: teardownPuppeteer } = require('jest-environment-puppeteer');

const { teardownDatabase } = require('../path/to/your/db/teardown'); // Custom teardown function for database

module.exports = async function globalTeardown(globalConfig) {
  await teardownPuppeteer(globalConfig);
  await teardownDatabase();
  delete process.env.TEST_GLOBAL_VARIABLE;
  console.log('Global teardown completed.');
};
