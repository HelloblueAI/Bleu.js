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

import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import express from 'express';
import mongoose from 'mongoose';
import cluster from 'cluster';
import os from 'os';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createLogger, transports, format } from 'winston';
import { WebSocketServer } from 'ws';
import { createClient } from 'redis';
import eggRoutes from './routes/egg.routes.js';

const numCPUs = os.cpus().length;
const PORT = process.env.PORT || 3003;
const WS_PORT = process.env.WS_PORT || 8081;
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/bleujs';
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT, 10) || 6379;
const CORS_ALLOWED = process.env.CORS_ORIGINS?.split(',') || [
  'http://localhost:4002',
];

/** 📌 Logger Configuration */
const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10 * 1024 * 1024,
    }),
    new transports.File({
      filename: 'logs/app.log',
      maxsize: 10 * 1024 * 1024,
    }),
  ],
});

/** 🔧 MongoDB Connection */
async function connectToMongoDB() {
  let retries = 5;
  while (retries) {
    try {
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
      logger.info(`✅ MongoDB Connected: ${mongoose.connection.host}`);
      return;
    } catch (error) {
      logger.error(
        `❌ MongoDB Connection Failed (${retries} retries left):`,
        error,
      );
      retries -= 1;
      await new Promise((res) =>
        setTimeout(res, Math.pow(2, 5 - retries) * 1000),
      );
    }
  }
  process.exit(1);
}

/** 📡 Redis Client */
const redisClient = createClient({
  socket: { host: REDIS_HOST, port: REDIS_PORT },
});
redisClient.on('error', (err) =>
  logger.error('❌ Redis Connection Failed:', err),
);
await redisClient.connect();

/** 🔗 WebSocket Clients */
const activeClients = new Set();

/** 📢 Broadcast Messages */
const broadcastMessage = (message, sender = null) => {
  activeClients.forEach((client) => {
    if (client !== sender && client.readyState === client.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

/** 🔥 WebSocket Handler */
const handleWebSocket = (wss) => {
  wss.on('connection', (ws) => {
    activeClients.add(ws);
    const requestId = `ws-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    logger.info(
      `🔗 WebSocket Connected | Active Clients: ${activeClients.size} | RequestID: ${requestId}`,
    );

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (!data || typeof data !== 'object' || !data.event) {
          throw new Error(
            "Invalid message format. Expected JSON object with 'event' field.",
          );
        }

        logger.info(
          `📨 WS Message Received [${requestId}]: ${JSON.stringify(data)}`,
        );

        switch (data.event) {
          case 'ping':
            ws.send(JSON.stringify({ event: 'pong', timestamp: Date.now() }));
            break;

          case 'generate_egg': {
            if (!data.type || !data.rarity || !data.power) {
              ws.send(
                JSON.stringify({
                  error: 'Missing fields: type, rarity, or power',
                }),
              );
              return;
            }
            const egg = {
              event: 'egg_generated',
              type: data.type,
              rarity: data.rarity,
              power: data.power,
              timestamp: Date.now(),
            };
            ws.send(JSON.stringify(egg));
            broadcastMessage(egg, ws);
            break;
          }

          case 'subscribe':
            if (!data.category) {
              ws.send(
                JSON.stringify({
                  error: "Missing 'category' field in subscribe event.",
                }),
              );
              return;
            }
            ws.send(
              JSON.stringify({ event: 'subscribed', category: data.category }),
            );
            break;

          default:
            ws.send(JSON.stringify({ error: 'Unknown event type' }));
        }
      } catch (error) {
        logger.error(`❌ WS Error [${requestId}]: ${error.message}`);
        ws.send(JSON.stringify({ error: 'Invalid WebSocket message format.' }));
      }
    });

    ws.on('close', () => {
      activeClients.delete(ws);
      logger.info(
        `❌ WebSocket Disconnected | Active Clients: ${activeClients.size} | RequestID: ${requestId}`,
      );
    });

    ws.on('error', (error) => {
      logger.error(`🚨 WS Connection Error [${requestId}]:`, error);
    });
  });

  return wss;
};

/** 🚀 Cluster Mode */
if (cluster.isPrimary) {
  logger.info(`🚀 Master process ${process.pid} managing ${numCPUs} workers`);

  for (let i = 0; i < numCPUs; i++) cluster.fork();

  cluster.on('exit', (worker) => {
    logger.warn(`⚠️ Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });

  setInterval(() => {
    redisClient.publish(
      'market-update',
      JSON.stringify({ event: 'market_update', timestamp: Date.now() }),
    );
  }, 5000);

  const wss = new WebSocketServer({ port: WS_PORT });
  handleWebSocket(wss);
} else {
  const app = express();
  await connectToMongoDB();

  app.use(helmet());
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(cors({ origin: CORS_ALLOWED, credentials: true }));

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: async (req) => (req.ip.startsWith('192.168.') ? 2000 : 1000),
      message: {
        error: 'Rate limit exceeded',
        upgrade: 'https://bleujs.com/pricing',
      },
    }),
  );

  app.get('/health', (req, res) =>
    res.status(200).json({ status: 'healthy', version: '4.0.0' }),
  );

  app.use('/api/eggs', eggRoutes);

  app.use((err, req, res, next) => {
    logger.error('❌ Error:', err);
    res.status(500).json({ success: false, error: err.message });
  });

  app.listen(PORT, () =>
    logger.info(`🚀 API running on port ${PORT} | Worker ${process.pid}`),
  );
}
