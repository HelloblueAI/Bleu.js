'use strict';

var _Object$defineProperty = require('@babel/runtime-corejs3/core-js-stable/object/define-property');
_Object$defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;
var _RuleModel = require('../models/RuleModel');
var _logger = require('../src/utils/logger');
/* eslint-env node */

const seedDatabase = async () => {
  const data = [
    {
      name: 'Sample Rule',
      description: 'This is a sample rule for seeding',
    },
  ];
  try {
    await (0, _RuleModel.insertMany)(data);
    (0, _logger.info)('Database seeded successfully');
  } catch (error) {
    (0, _logger.error)('Error seeding database:', error);
  }
};
var _default = (exports.default = {
  seedDatabase,
});
