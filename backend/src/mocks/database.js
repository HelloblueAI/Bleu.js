'use strict';

var _Object$defineProperty = require('@babel/runtime-corejs3/core-js-stable/object/define-property');
var _interopRequireDefault = require('@babel/runtime-corejs3/helpers/interopRequireDefault');
_Object$defineProperty(exports, '__esModule', {
  value: true,
});
exports.disconnect = exports.connect = void 0;
var _mongoose = _interopRequireDefault(require('mongoose'));
const connect = async () => {
  try {
    await _mongoose.default.connect('your-mongodb-uri');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};
exports.connect = connect;
const disconnect = async () => {
  try {
    await _mongoose.default.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('MongoDB disconnection error:', error);
    throw error;
  }
};
exports.disconnect = disconnect;
