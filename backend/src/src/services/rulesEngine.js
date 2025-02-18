'use strict';

var _Object$defineProperty = require('@babel/runtime-corejs3/core-js-stable/object/define-property');
var _interopRequireDefault = require('@babel/runtime-corejs3/helpers/interopRequireDefault');
_Object$defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;
var _forEach = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/instance/for-each'),
);
var _map = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/instance/map'),
);
var _jsonRulesEngine = require('json-rules-engine');
var _logger = _interopRequireDefault(require('../src/utils/logger'));
/* eslint-env node */

class RulesEngine {
  constructor() {
    this.engine = new _jsonRulesEngine.Engine();
    this.rules = [];
    this.logger = _logger.default;
    this.addRules();
  }
  addRules() {
    var _context;
    this.rules.push({
      conditions: {
        any: [
          {
            fact: 'temperature',
            operator: 'greaterThanInclusive',
            value: 100,
          },
        ],
      },
      event: {
        type: 'High temperature detected',
        params: {
          message: 'High temperature detected',
        },
      },
    });
    this.rules.push({
      conditions: {
        any: [
          {
            fact: 'temperature',
            operator: 'greaterThanInclusive',
            value: 120,
          },
        ],
      },
      event: {
        type: 'Extremely high temperature detected',
        params: {
          message: 'Extremely high temperature detected',
        },
      },
    });
    (0, _forEach.default)((_context = this.rules)).call(_context, (rule) =>
      this.engine.addRule(rule),
    );
  }
  async evaluate(data) {
    try {
      var _context2;
      const results = await this.engine.run(data);
      return (0, _map.default)((_context2 = results.events)).call(
        _context2,
        (event) => event.params,
      );
    } catch (error) {
      this.logger.error('Error evaluating rules:', error);
      throw error;
    }
  }
}
var _default = (exports.default = RulesEngine);
