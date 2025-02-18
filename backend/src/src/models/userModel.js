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
const userSchema = new _mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: _now.default,
  },
  updatedAt: {
    type: Date,
    default: _now.default,
  },
});
userSchema.pre('save', function (next) {
  this.updatedAt = (0, _now.default)();
  next();
});
const User = (0, _mongoose.model)('User', userSchema);
var _default = (exports.default = User);
