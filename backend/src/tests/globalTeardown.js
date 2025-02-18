'use strict';

var _Object$defineProperty = require('@babel/runtime-corejs3/core-js-stable/object/define-property');
_Object$defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = globalTeardown;
var _jestEnvironmentPuppeteer = require('jest-environment-puppeteer');
var _teardown = require('../path/to/your/db/teardown');
async function globalTeardown(globalConfig) {
  await (0, _jestEnvironmentPuppeteer.teardown)(globalConfig);
  await (0, _teardown.teardownDatabase)();
  delete process.env.TEST_GLOBAL_VARIABLE;
  console.log('Global teardown completed.');
}
