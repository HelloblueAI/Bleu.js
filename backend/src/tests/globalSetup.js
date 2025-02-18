'use strict';

var _Object$defineProperty = require('@babel/runtime-corejs3/core-js-stable/object/define-property');
_Object$defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = globalSetup;
var _jestEnvironmentPuppeteer = require('jest-environment-puppeteer');
var _setup = require('../path/to/your/db/setup');
async function globalSetup(globalConfig) {
  await (0, _jestEnvironmentPuppeteer.setup)(globalConfig);
  await (0, _setup.setupDatabase)();
  process.env.TEST_GLOBAL_VARIABLE = 'some_value';
  console.log('Global setup completed.');
}
