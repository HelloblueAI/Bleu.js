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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5005;
const MONGODB_URI = process.env.MONGODB_URI || '';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'logs/app.log',
      maxsize: 5 * 1024 * 1024,
    }),
  ],
});

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(
  morgan('tiny', { stream: { write: (msg) => logger.info(msg.trim()) } }),
);

async function connectMongoDB() {
  if (!MONGODB_URI) {
    logger.error('❌ MongoDB URI is missing.');
    process.exit(1);
  }
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('✅ Connected to MongoDB.');
  } catch (error) {
    logger.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
}
connectMongoDB();

app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: '🚀 Bleu.js Backend is Running!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/health', async (_req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected';
  res.json({
    status: 'success',
    server: 'Running',
    dbStatus,
    timestamp: new Date().toISOString(),
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
  });
});

/**
 * 🎯 AI-Powered Prediction Route
 */
app.post('/predict', async (req, res) => {
  try {
    const { features } = req.body;
    if (!Array.isArray(features) || !features.length) {
      logger.warn('⚠️ Invalid request format');
      return res
        .status(400)
        .json({ status: 'error', message: 'Invalid input format' });
    }
    logger.info(`📡 Prediction Request: ${JSON.stringify(features)}`);

    const scriptPath = path.join(__dirname, 'xgboost_predict.py');
    if (!fs.existsSync(scriptPath)) {
      logger.error(`❌ Prediction script not found: ${scriptPath}`);
      return res
        .status(500)
        .json({ status: 'error', message: 'Prediction script not found' });
    }

    const startTime = process.hrtime();
    const pythonProcess = spawn('python3', [
      scriptPath,
      JSON.stringify(features),
    ]);

    let output = '',
      errorOutput = '',
      responseSent = false;
    pythonProcess.stdout.on(
      'data',
      (data) => (output += data.toString().trim()),
    );
    pythonProcess.stderr.on(
      'data',
      (data) => (errorOutput += data.toString().trim()),
    );

    pythonProcess.on('close', (code) => {
      if (responseSent) return;
      const execTimeMs = process.hrtime(startTime);
      const execTime = (execTimeMs[0] * 1000 + execTimeMs[1] / 1e6).toFixed(2);

      try {
        if (code === 0 && output.trim()) {
          const parsedOutput = JSON.parse(output.trim());
          logger.info(
            `✅ Prediction Success in ${execTime}ms: ${JSON.stringify(parsedOutput)}`,
          );
          responseSent = true;
          return res
            .status(200)
            .json({ status: 'success', prediction: parsedOutput });
        } else {
          throw new Error(
            `Prediction failed. Exit code: ${code}, Stderr: ${errorOutput}`,
          );
        }
      } catch (error) {
        if (!responseSent) {
          logger.error(`❌ Prediction Error: ${error.message}`);
          responseSent = true;
          return res
            .status(500)
            .json({ status: 'error', message: 'Internal Server Error' });
        }
      }
    });

    pythonProcess.on('error', (error) => {
      if (!responseSent) {
        logger.error(`❌ Python Process Error: ${error.message}`);
        responseSent = true;
        res
          .status(500)
          .json({ status: 'error', message: 'Internal Server Error' });
      }
    });
  } catch (error) {
    logger.error(`❌ Prediction Error: ${error.message}`);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

const server = app.listen(PORT, () =>
  logger.info(`✅ Server running on http://localhost:${PORT}`),
);

const shutdown = async (signal) => {
  try {
    logger.warn(`🛑 Received ${signal}. Shutting down gracefully...`);
    await mongoose.connection.close();
    logger.info('🛑 MongoDB Connection closed.');
    server.close(() => {
      logger.info('✅ Server closed.');
      process.exit(0);
    });
  } catch (err) {
    logger.error(`❌ MongoDB Shutdown Error: ${err.message}`);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', (err) => {
  logger.error(`❌ Uncaught Exception: ${err.stack}`);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  logger.error(`❌ Unhandled Rejection: ${err.stack}`);
});
