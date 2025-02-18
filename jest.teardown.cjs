// jest.teardown.cjs
const path = require('path');

module.exports = async () => {
  // Clean up test resources
  if (global.mongod) {
    await global.mongod.stop();
  }

  // Reset environment
  delete process.env.MONGODB_URI;

  // Clean up any remaining handles
  await new Promise(resolve => setTimeout(resolve, 500));
};
