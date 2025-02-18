'use strict';

var _interopRequireDefault = require('@babel/runtime-corejs3/helpers/interopRequireDefault');
var _forEach = _interopRequireDefault(
  require('@babel/runtime-corejs3/core-js-stable/instance/for-each'),
);
/* eslint-env node */

const fs = require('fs');
const path = require('path');
const reportDir = path.join(
  __dirname,
  '..',
  '..',
  'jest-html-reporters-attach',
);
const reportFile = path.join(reportDir, 'report.html');
const generateReport = (data) => {
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, {
      recursive: true,
    });
  }
  let html = '<html><head><title>Test Report</title></head><body>';
  html += '<h1>Test Report</h1>';
  html += `<p>${data}</p>`;
  html += '</body></html>';
  fs.writeFileSync(reportFile, html);
};
const readData = () => {
  const dataFile = path.join(__dirname, 'data.json');
  if (fs.existsSync(dataFile)) {
    const rawData = fs.readFileSync(dataFile);
    return JSON.parse(rawData);
  }
  return null;
};
const processData = (data) => {
  if (!data) return;
  (0, _forEach.default)(data).call(data, (item) => {
    console.log(`Processing ${item.name}`);
  });
};
const main = () => {
  const data = readData();
  processData(data);
  generateReport('This is a sample report');
};
main();
