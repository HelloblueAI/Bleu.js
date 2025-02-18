'use strict';

var _Object$defineProperty = require('@babel/runtime-corejs3/core-js-stable/object/define-property');
var _interopRequireDefault = require('@babel/runtime-corejs3/helpers/interopRequireDefault');
_Object$defineProperty(exports, '__esModule', {
  value: true,
});
exports.save =
  exports.findByIdAndUpdate =
  exports.findByIdAndDelete =
  exports.findById =
  exports.find =
    void 0;
var _promise = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/promise'),
);
const find = (exports.find = jest.fn().mockResolvedValue([]));
const findById = (exports.findById = jest.fn((id) => {
  if (id === 'valid-id') {
    return _promise.default.resolve({
      _id: 'valid-id',
      conditions: [
        {
          key: 'age',
          operator: 'greater_than',
          value: 18,
        },
      ],
      actions: ['approve'],
    });
  }
  return _promise.default.resolve(null);
}));
const save = (exports.save = jest.fn().mockResolvedValue(true));
const findByIdAndUpdate = (exports.findByIdAndUpdate = jest
  .fn()
  .mockResolvedValue({
    _id: 'valid-id',
    conditions: [
      {
        key: 'age',
        operator: 'greater_than',
        value: 18,
      },
    ],
    actions: ['reject'],
  }));
const findByIdAndDelete = (exports.findByIdAndDelete = jest
  .fn()
  .mockResolvedValue(true));
