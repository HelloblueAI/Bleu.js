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

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Schema, model, connect, disconnect, Document } from 'mongoose';
import winston from 'winston';

dotenv.config();

interface IRule extends Document {
  name: string;
  conditions: string[];
  actions: string[];
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message }) =>
        `${timestamp} [${level.toUpperCase()}]: ${message}`,
    ),
  ),
  transports: [new winston.transports.Console()],
});

// Check for .env file
function checkEnvFile(): void {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    logger.error(
      'Missing .env file. Ensure the file exists in the project root.',
    );
    process.exit(1);
  }
  logger.info('.env file found and loaded.');
}

function validateEnv(): string {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    logger.error('MONGODB_URI is not defined in the environment variables.');
    process.exit(1);
  }
  return mongoUri;
}

const ruleSchema = new Schema<IRule>({
  name: { type: String, required: true },
  conditions: { type: [String], default: [] },
  actions: { type: [String], default: [] },
});

const RuleModel = model<IRule>('Rule', ruleSchema);

async function performDatabaseOperations(): Promise<void> {
  const mongoUri = validateEnv();
  try {
    await connect(mongoUri);
    logger.info('Successfully connected to MongoDB.');

    const ruleDoc = new RuleModel({
      name: 'Test Rule',
      conditions: ['condition1', 'condition2'],
      actions: ['approve', 'notify'],
    });
    await ruleDoc.save();
    logger.info('Document saved:', JSON.stringify(ruleDoc));

    const retrievedDoc = await RuleModel.findOne({ name: 'Test Rule' });
    logger.info('Document retrieved:', JSON.stringify(retrievedDoc));

    const updatedDoc = await RuleModel.findOneAndUpdate(
      { name: 'Test Rule' },
      { $set: { actions: ['reject'] } },
      { new: true },
    );
    logger.info('Document updated:', JSON.stringify(updatedDoc));

    await RuleModel.deleteOne({ name: 'Test Rule' });
    logger.info('Document deleted successfully.');
  } catch (err) {
    logger.error('Error performing database operations:', err instanceof Error ? err.message : String(err));
  } finally {
    await disconnect();
    logger.info('Disconnected from MongoDB.');
  }
}

(async function runTest(): Promise<void> {
  logger.info('Starting manual connection test...');
  checkEnvFile();
  await performDatabaseOperations();
  logger.info('Manual connection test completed.');
})(); 