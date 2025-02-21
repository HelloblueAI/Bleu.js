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

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';

import { spawn } from 'child_process';

import fs from 'fs';

import path from 'path';
import { fileURLToPath } from 'url';
import winston from 'winston';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5005;
const MONGODB_URI = process.env.MONGODB_URI || '';

/**
 * 🚀 Logger Configuration
 */
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'logs/app.log',
      maxsize: 5 * 1024 * 1024,
    }),
  ],
});

/**
 * 🌐 Express App Configuration
 */
const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(morgan('tiny', { stream: { write: (msg) => logger.info(msg.trim()) } }));

/**
 * 🔐 API Key Authentication
 */
const validApiKeys = new Map([
  ['your-api-key-1', true],
  ['your-api-key-2', true],
]);
const generateApiKey = () => crypto.randomBytes(16).toString('hex');
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || !validApiKeys.has(apiKey)) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }
  next();
});

/**
 * ⚡ Rate Limiting
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

/**
 * 🔄 MongoDB Connection with Auto-Reconnect
 */
async function connectMongoDB() {
  if (!MONGODB_URI) {
    logger.error('❌ MongoDB URI is missing.');
    process.exit(1);
  }
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });

    mongoose.connection.on('connected', () => {
      logger.info('✅ MongoDB connected successfully.');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected. Reconnecting...');
      setTimeout(connectMongoDB, 5000);
    });

    mongoose.connection.on('error', (error) => {
      logger.error(`❌ MongoDB Connection Error: ${error.message}`);
      process.exit(1);
    });
  } catch (error) {
    logger.error(`❌ MongoDB Initial Connection Failed: ${error.message}`);
    process.exit(1);
  }
}
connectMongoDB();

/**
 * 📡 Health Check Routes
 */
app.get('/health', async (_req, res) => {

  res.json({
    status: 'success',
    server: 'Running',
    dbStatus: mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected',
    timestamp: new Date().toISOString(),
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
  });
});

/**
 * 🎯 AI-Powered Prediction Route with Caching
 */
const predictionCache = new Map();
app.post('/predict', async (req, res) => {
  try {
    const { features } = req.body;

    if (!Array.isArray(features) || !features.length) {
      logger.warn('⚠️ Invalid request format');
      return res.status(400).json({ status: 'error', message: 'Invalid input format' });
    }

    const cacheKey = JSON.stringify(features);
    if (predictionCache.has(cacheKey)) {
      logger.info(`📡 Using cached prediction for: ${cacheKey}`);
      return res.status(200).json({ status: 'success', prediction: predictionCache.get(cacheKey) });
    }

    const scriptPath = path.join(__dirname, 'xgboost_predict.py');
    if (!fs.existsSync(scriptPath)) {
      logger.error(`❌ Prediction script not found: ${scriptPath}`);
      return res.status(500).json({ status: 'error', message: 'Prediction script not found' });
    }

    const pythonProcess = spawn('python3', [scriptPath, JSON.stringify(features)]);
    let output = '';

    pythonProcess.stdout.on('data', (data) => (output += data.toString().trim()));
    pythonProcess.stderr.on('data', (data) => logger.error(`❌ Python Error: ${data.toString().trim()}`));

    pythonProcess.on('close', (code) => {
      if (code === 0 && output.trim()) {
        const parsedOutput = JSON.parse(output.trim());
        predictionCache.set(cacheKey, parsedOutput);
        return res.status(200).json({ status: 'success', prediction: parsedOutput });
      } else {
        return res.status(500).json({ status: 'error', message: 'Prediction failed' });
      }
    });
  } catch (error) {
    logger.error(`❌ Prediction Error: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * 🚀 Start Server
 */
const server = app.listen(PORT, () => logger.info(`✅ Server running on http://localhost:${PORT}`));
