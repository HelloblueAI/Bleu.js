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

import { performance } from 'perf_hooks';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    new winston.transports.File({ filename: 'logs/request-tracker.log' }),
  ],
});

export default function requestTracker(req, res, next) {
  const startTime = performance.now();
  const requestId = req.headers['x-request-id'] || uuidv4();
  const clientIp =
    req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const requestMethod = req.method;
  const requestUrl = req.originalUrl;

  req.tracking = { requestId, clientIp, userAgent, startTime };

  logger.info(`[REQUEST] [${requestMethod}] ${requestUrl}`, {
    requestId,
    clientIp,
    userAgent,
    method: requestMethod,
    url: requestUrl,
    timestamp: new Date().toISOString(),
  });

  res.on('finish', () => {
    const endTime = performance.now();
    const executionTime = (endTime - startTime).toFixed(2);
    const statusCode = res.statusCode;

    logger.info(
      `[RESPONSE] [${statusCode}] ${requestUrl} - ${executionTime}ms`,
      {
        requestId,
        clientIp,
        userAgent,
        method: requestMethod,
        url: requestUrl,
        statusCode,
        executionTime,
        timestamp: new Date().toISOString(),
      },
    );
  });

  next();
}
