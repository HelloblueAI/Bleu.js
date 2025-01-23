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
