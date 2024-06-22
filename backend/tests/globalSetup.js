const { setup: setupPuppeteer } = require('jest-environment-puppeteer');

const { setupDatabase } = require('../path/to/your/db/setup');

module.exports = async function globalSetup(globalConfig) {
  await setupPuppeteer(globalConfig);
  await setupDatabase();
  process.env.TEST_GLOBAL_VARIABLE = 'some_value';
  console.log('Global setup completed.');
};
