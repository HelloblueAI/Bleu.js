const { setup: setupPuppeteer } = require('jest-environment-puppeteer');

const { setupDatabase } = require('../path/to/your/db/setup');

module.exports = async function globalSetup(globalConfig) {
  try {
    // Setup Puppeteer environment
    await setupPuppeteer(globalConfig);

    // Setup database for tests
    await setupDatabase();

    // Set global environment variables for tests
    process.env.TEST_GLOBAL_VARIABLE = 'some_value';

    console.log('Global setup completed successfully.');
  } catch (error) {
    console.error('Error during global setup:', error);
    throw error; // Ensure Jest fails if setup fails
  }
};
