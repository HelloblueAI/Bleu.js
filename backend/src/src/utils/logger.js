'use strict';

var _Object$defineProperty = require('@babel/runtime-corejs3/core-js-stable/object/define-property');
_Object$defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;
var _winston = require('winston');
const logger = (0, _winston.createLogger)({
  level: 'info',
  format: _winston.format.combine(
    _winston.format.timestamp(),
    _winston.format.printf((_ref) => {
      let { timestamp, level, message } = _ref;
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    }),
  ),
  transports: [new _winston.transports.Console()],
});
var _default = (exports.default = logger);
