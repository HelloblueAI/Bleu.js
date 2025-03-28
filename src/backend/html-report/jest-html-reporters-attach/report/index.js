//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
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
    fs.mkdirSync(reportDir, { recursive: true });
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
  data.forEach((item) => {
    console.log(`Processing ${item.name}`);
  });
};

const main = () => {
  const data = readData();
  processData(data);
  generateReport('This is a sample report');
};

main();
