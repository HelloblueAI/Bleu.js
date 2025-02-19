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
'use strict';

/* eslint-env node */
const { spawn } = require('child_process');
const path = require('path');
const logger = require('../src/utils/logger');

/**
 * Manages model training, evaluation, and dataset uploads.
 */
class ModelManager {
  constructor() {
    this.trainScript = path.join(__dirname, 'models', 'train.py');
    this.evaluateScript = path.join(__dirname, 'models', 'evaluate.py');
    this.uploadScript = path.join(__dirname, 'models', 'upload.py');
  }

  /**
   * Trains the model using the provided model info.
   * @param {Object} modelInfo - Model configuration details.
   * @returns {Promise<string>} - Training completion message.
   */
  trainModel(modelInfo) {
    return new Promise((resolve, reject) => {
      if (!modelInfo || typeof modelInfo !== 'object') {
        return reject(new Error('Invalid modelInfo provided.'));
      }

      logger.info('🚀 Starting model training...');
      const process = spawn('python3', [
        this.trainScript,
        '--modelInfo',
        JSON.stringify(modelInfo),
      ]);

      process.stdout.on('data', (data) => {
        logger.info(`📢 Train stdout: ${data.toString().trim()}`);
      });

      process.stderr.on('data', (data) => {
        logger.error(`⚠️ Train stderr: ${data.toString().trim()}`);
      });

      process.on('close', (code) => {
        if (code === 0) {
          logger.info('✅ Training completed successfully.');
          resolve('Training completed.');
        } else {
          reject(new Error(`❌ Training process exited with code ${code}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`❌ Training process failed: ${error.message}`));
      });
    });
  }

  /**
   * Retrieves the training status.
   * @returns {Promise<string>} - Training status.
   */
  getTrainModelStatus() {
    logger.info('📊 Retrieving training status...');
    return Promise.resolve('Training status not implemented.');
  }

  /**
   * Uploads a dataset for model training.
   * @param {string} datasetPath - Path to the dataset file.
   * @returns {Promise<string>} - Upload completion message.
   */
  uploadDataset(datasetPath) {
    return new Promise((resolve, reject) => {
      if (!datasetPath || typeof datasetPath !== 'string') {
        return reject(new Error('Invalid dataset path provided.'));
      }

      logger.info(`📤 Uploading dataset: ${datasetPath}`);
      const process = spawn('python3', [this.uploadScript, '--file', datasetPath]);

      process.stdout.on('data', (data) => {
        logger.info(`📢 Upload stdout: ${data.toString().trim()}`);
      });

      process.stderr.on('data', (data) => {
        logger.error(`⚠️ Upload stderr: ${data.toString().trim()}`);
      });

      process.on('close', (code) => {
        if (code === 0) {
          logger.info('✅ Dataset uploaded successfully.');
          resolve('Dataset upload completed.');
        } else {
          reject(new Error(`❌ Upload process exited with code ${code}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`❌ Upload process failed: ${error.message}`));
      });
    });
  }

  /**
   * Evaluates a rule using AI models.
   * @param {string} ruleId - Rule identifier.
   * @param {Object} inputData - Input data for evaluation.
   * @returns {Promise<string>} - Evaluation completion message.
   */
  evaluateRule(ruleId, inputData) {
    return new Promise((resolve, reject) => {
      if (!ruleId || typeof ruleId !== 'string' || !inputData || typeof inputData !== 'object') {
        return reject(new Error('Invalid ruleId or inputData provided.'));
      }

      logger.info(`🔍 Evaluating rule: ${ruleId}`);
      const process = spawn('python3', [
        this.evaluateScript,
        '--ruleId',
        ruleId,
        '--inputData',
        JSON.stringify(inputData),
      ]);

      process.stdout.on('data', (data) => {
        logger.info(`📢 Evaluate stdout: ${data.toString().trim()}`);
      });

      process.stderr.on('data', (data) => {
        logger.error(`⚠️ Evaluate stderr: ${data.toString().trim()}`);
      });

      process.on('close', (code) => {
        if (code === 0) {
          logger.info('✅ Evaluation completed successfully.');
          resolve('Evaluation completed.');
        } else {
          reject(new Error(`❌ Evaluation process exited with code ${code}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`❌ Evaluation process failed: ${error.message}`));
      });
    });
  }
}

module.exports = ModelManager;

