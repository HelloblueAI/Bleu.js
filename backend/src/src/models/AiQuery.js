'use strict';

var _Object$defineProperty = require('@babel/runtime-corejs3/core-js-stable/object/define-property');
var _interopRequireDefault = require('@babel/runtime-corejs3/helpers/interopRequireDefault');
_Object$defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;
var _now = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/date/now'),
);
var _mongoose = require('mongoose');
const AiQuerySchema = new _mongoose.Schema({
  query: {
    type: String,
    required: true,
  },
  response: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: _now.default,
  },
  modelUsed: {
    type: String,
    required: true,
  },
  confidence: {
    type: Number,
    default: 0.95,
  },
});
const AiQuery = (0, _mongoose.model)('AiQuery', AiQuerySchema);
var _default = (exports.default = AiQuery);
