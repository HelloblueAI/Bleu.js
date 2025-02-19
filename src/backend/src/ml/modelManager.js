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
const { spawn } = require('child_process');
const path = require('path');

const logger = require('../src/utils/logger').default;

class ModelManager {
  constructor() {
    this.trainScript = path.join(__dirname, 'models', 'train.py');
    this.evaluateScript = path.join(__dirname, 'models', 'evaluate.py');
  }

  trainModel(modelInfo) {
    return new Promise((resolve, reject) => {
      const process = spawn('python3', [
        this.trainScript,
        '--modelInfo',
        JSON.stringify(modelInfo),
      ]);

      process.stdout.on('data', (data) => {
        logger.info(`Train stdout: ${data}`);
      });

      process.stderr.on('data', (data) => {
        logger.error(`Train stderr: ${data}`);
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve('Training completed');
        } else {
          reject(new Error(`Training process exited with code ${code}`));
        }
      });
    });
  }

  getTrainModelStatus() {
    return Promise.resolve('Training status not implemented');
  }

  uploadDataset() {
    return Promise.resolve('Upload dataset not implemented');
  }

  evaluateRule(ruleId, inputData) {
    return new Promise((resolve, reject) => {
      const process = spawn('python3', [
        this.evaluateScript,
        '--ruleId',
        ruleId,
        '--inputData',
        JSON.stringify(inputData),
      ]);

      process.stdout.on('data', (data) => {
        logger.info(`Evaluate stdout: ${data}`);
      });

      process.stderr.on('data', (data) => {
        logger.error(`Evaluate stderr: ${data}`);
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve('Evaluation completed');
        } else {
          reject(new Error(`Evaluation process exited with code ${code}`));
        }
      });
    });
  }
}

module.exports = ModelManager;
