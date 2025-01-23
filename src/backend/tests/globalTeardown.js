import { teardown as teardownPuppeteer } from 'jest-environment-puppeteer';

import { teardownDatabase } from '../path/to/your/db/teardown';

export default async function globalTeardown(globalConfig) {
  await teardownPuppeteer(globalConfig);
  await teardownDatabase();
  delete process.env.TEST_GLOBAL_VARIABLE;
  console.log('Global teardown completed.');
}
