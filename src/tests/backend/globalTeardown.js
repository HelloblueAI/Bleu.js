const { teardown: teardownPuppeteer } = require('jest-environment-puppeteer');

const { teardownDatabase } = require('../path/to/your/db/teardown'); // Custom teardown function for database

module.exports = async function globalTeardown(globalConfig) {
  console.log('Starting global teardown...');

  try {
    // Teardown Puppeteer environment
    if (teardownPuppeteer) {
      console.log('Tearing down Puppeteer environment...');
      await teardownPuppeteer(globalConfig);
      console.log('Puppeteer environment torn down successfully.');
    } else {
      console.warn('Puppeteer teardown function is not available.');
    }

    // Teardown database connections
    if (teardownDatabase) {
      console.log('Tearing down database connections...');
      await teardownDatabase();
      console.log('Database connections torn down successfully.');
    } else {
      console.warn('Database teardown function is not available.');
    }

    // Cleanup global variables
    if (process.env.TEST_GLOBAL_VARIABLE) {
      console.log('Cleaning up global environment variables...');
      delete process.env.TEST_GLOBAL_VARIABLE;
      console.log('Global environment variables cleaned up.');
    }

    console.log('Global teardown completed successfully.');
  } catch (error) {
    console.error('An error occurred during global teardown:', error);
    throw error; // Re-throw the error to ensure Jest is aware of the issue
  }
};
