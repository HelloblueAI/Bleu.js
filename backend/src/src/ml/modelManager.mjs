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

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import logger from '../utils/logger.mjs'; // Ensure logger is in .mjs

/**
 * Resolving __dirname in ESM
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  async trainModel(modelInfo) {
    if (!modelInfo || typeof modelInfo !== 'object') {
      throw new Error('Invalid modelInfo provided.');
    }

    logger.info('🚀 Starting model training...');
    return this.runPythonScript(this.trainScript, ['--modelInfo', JSON.stringify(modelInfo)]);
  }

  /**
   * Retrieves the training status.
   * @returns {Promise<string>} - Training status.
   */
  async getTrainModelStatus() {
    logger.info('📊 Retrieving training status...');
    return 'Training status not implemented.';
  }

  /**
   * Uploads a dataset for model training.
   * @param {string} datasetPath - Path to the dataset file.
   * @returns {Promise<string>} - Upload completion message.
   */
  async uploadDataset(datasetPath) {
    if (!datasetPath || typeof datasetPath !== 'string') {
      throw new Error('Invalid dataset path provided.');
    }

    logger.info(`📤 Uploading dataset: ${datasetPath}`);
    return this.runPythonScript(this.uploadScript, ['--file', datasetPath]);
  }

  /**
   * Evaluates a rule using AI models.
   * @param {string} ruleId - Rule identifier.
   * @param {Object} inputData - Input data for evaluation.
   * @returns {Promise<string>} - Evaluation completion message.
   */
  async evaluateRule(ruleId, inputData) {
    if (!ruleId || typeof ruleId !== 'string' || !inputData || typeof inputData !== 'object') {
      throw new Error('Invalid ruleId or inputData provided.');
    }

    logger.info(`🔍 Evaluating rule: ${ruleId}`);
    return this.runPythonScript(this.evaluateScript, [
      '--ruleId', ruleId,
      '--inputData', JSON.stringify(inputData)
    ]);
  }

  /**
   * Runs a Python script as a child process.
   * @param {string} scriptPath - Path to the Python script.
   * @param {string[]} args - Arguments to pass to the script.
   * @returns {Promise<string>} - Resolves when the script completes.
   */
  runPythonScript(scriptPath, args = []) {
    return new Promise((resolve, reject) => {
      const process = spawn('python3', [scriptPath, ...args]);

      process.stdout.on('data', (data) => {
        logger.info(`📢 Output: ${data.toString().trim()}`);
      });

      process.stderr.on('data', (data) => {
        logger.error(`⚠️ Error: ${data.toString().trim()}`);
      });

      process.on('close', (code) => {
        if (code === 0) {
          logger.info('✅ Process completed successfully.');
          resolve('Process completed.');
        } else {
          reject(new Error(`❌ Process exited with code ${code}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`❌ Process failed: ${error.message}`));
      });
    });
  }
}

export default ModelManager;
