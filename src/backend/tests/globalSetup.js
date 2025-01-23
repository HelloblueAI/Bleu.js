import { setup as setupPuppeteer } from 'jest-environment-puppeteer';

import { setupDatabase } from '../path/to/your/db/setup';

export default async function globalSetup(globalConfig) {
  await setupPuppeteer(globalConfig);
  await setupDatabase();
  process.env.TEST_GLOBAL_VARIABLE = 'some_value';
  console.log('Global setup completed.');
}
