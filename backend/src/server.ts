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
import express, { Request, Response, Application, NextFunction } from 'express';
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

import winston from 'winston';
import axios from 'axios';

dotenv.config();

const API_GATEWAY_URL =
  process.env.API_GATEWAY_URL ??
  'https://mozxitsnsh.execute-api.us-west-2.amazonaws.com/prod';

const AI_API_URL = process.env.AI_API_URL ?? 'http://localhost:8000/predict';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    }),
  ),
  transports: [new winston.transports.Console()],
});

export function createApp(): Application {
  const app = express();

  app.use(express.json({ limit: '1mb' }));
  app.use(helmet());
  app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
  app.use(morgan('combined'));

  const limiter: RateLimitRequestHandler = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 50,
    message: { status: 'error', message: 'Too many requests, slow down!' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter as unknown as express.RequestHandler);

  app.use(async (req: Request, res: Response, next: NextFunction) => {
    if (req.headers['x-api-gateway-event']) {
      logger.info(`🚀 Request from API Gateway: ${req.method} ${req.url}`);
    }
    next();
  });

  app.post('/predict', async (req: Request, res: Response) => {
    try {
      const { features } = req.body;

      if (!Array.isArray(features) || features.length === 0) {
        logger.warn('❌ Invalid request format');
        return res
          .status(400)
          .json({ status: 'error', message: 'Invalid input format' });
      }

      logger.info(
        `🔍 Received prediction request: ${JSON.stringify(features)}`,
      );

      const aiResponse = await axios.post(AI_API_URL, { features });

      logger.info(
        `✅ AI Prediction Success: ${JSON.stringify(aiResponse.data)}`,
      );

      return res.json({ status: 'success', prediction: aiResponse.data });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error(`❌ Prediction Error: ${errorMessage}`);

      return res
        .status(500)
        .json({ status: 'error', message: 'Prediction service failed' });
    }
  });

  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'success',
      message: '🚀 Bleu.js Backend is Healthy!',
      timestamp: new Date().toISOString(),
    });
  });

  app.use((req: Request, res: Response) => {
    logger.warn(`⚠️ 404 Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ status: 'error', message: 'Resource not found' });
  });

  return app;
}
