'use strict';

var _Object$defineProperty = require('@babel/runtime-corejs3/core-js-stable/object/define-property');
var _interopRequireDefault = require('@babel/runtime-corejs3/helpers/interopRequireDefault');
_Object$defineProperty(exports, '__esModule', {
  value: true,
});
exports.handleDelete = handleDelete;
exports.handleGet = handleGet;
exports.handleGetHtml = handleGetHtml;
exports.handleGetJson = handleGetJson;
exports.handleHead = handleHead;
exports.handleOptions = handleOptions;
exports.handlePatch = handlePatch;
exports.handlePost = handlePost;
exports.handlePut = handlePut;
var _includes = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/instance/includes'),
);
/* eslint-env node */

function handlePost(req, res) {
  var _context, _context2, _context3, _context4;
  if ((0, _includes.default)((_context = req.url)).call(_context, 'predict')) {
    if (req.body.input === null) {
      return res.status(400).json({
        error: 'Invalid input data',
      });
    }
    return res.status(200).json({
      prediction: 'Predicted result',
    });
  }
  if (
    (0, _includes.default)((_context2 = req.url)).call(_context2, 'processData')
  ) {
    return res.status(201).json({
      message: 'Data processed and stored successfully',
    });
  }
  if (
    (0, _includes.default)((_context3 = req.url)).call(_context3, 'trainModel')
  ) {
    return res.status(202).json({
      message: 'Model training started',
    });
  }
  if (
    (0, _includes.default)((_context4 = req.url)).call(
      _context4,
      'uploadDataset',
    )
  ) {
    return res.status(413).json({
      error: 'Payload Too Large',
    });
  }
  return res.status(201).json({
    message: 'Data received',
  });
}
function handlePut(req, res) {
  res.status(200).json({
    message: 'Data updated',
  });
}
function handleDelete(req, res) {
  res.status(200).json({
    message: 'Data deleted',
  });
}
function handlePatch(req, res) {
  res.status(200).json({
    message: 'Data patched',
  });
}
function handleHead(req, res) {
  res.status(200).end();
}
function handleOptions(req, res) {
  res
    .status(204)
    .setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    )
    .end();
}
function handleGet(req, res) {
  var _context5, _context6;
  if (
    (0, _includes.default)((_context5 = req.url)).call(
      _context5,
      'processedData',
    )
  ) {
    return res.status(200).json({
      data: [],
    });
  }
  if (
    (0, _includes.default)((_context6 = req.url)).call(
      _context6,
      'trainModel/status',
    )
  ) {
    return res.status(200).json({
      status: 'in progress',
    });
  }
  return res.status(200).json({
    message: 'Data fetched',
  });
}
function handleGetJson(req, res) {
  res.status(200).json({
    message: 'JSON Data',
  });
}
function handleGetHtml(req, res) {
  res.status(200).send('<html><body>HTML Data</body></html>');
}
