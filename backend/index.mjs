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

import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import winston from "winston";
import rateLimit from "express-rate-limit";
import compression from "compression";
import crypto from "crypto";
import http from "http";

dotenv.config();

/**
 * Core application configuration
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERSION = process.env.npm_package_version || "1.1.2";
const BUILD_NUMBER = process.env.BUILD_NUMBER || "0";
const PORT = parseInt(process.env.PORT, 10) || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "";
const INSTANCE_ID = process.env.INSTANCE_ID || process.env.NODE_APP_INSTANCE || "0";
const NODE_ENV = process.env.NODE_ENV || "development";

const SECURITY_CONFIG = {
  MAX_REQUEST_SIZE: process.env.MAX_REQUEST_SIZE || "5mb",
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15 * 60 * 1000,
  RATE_LIMIT_MAX: NODE_ENV === "production" ? parseInt(process.env.RATE_LIMIT_PROD, 10) || 100 : parseInt(process.env.RATE_LIMIT_DEV, 10) || 1000,
  CONNECTION_TIMEOUT: parseInt(process.env.CONNECTION_TIMEOUT, 10) || 10000,
  MONGOOSE_MAX_RETRIES: parseInt(process.env.MONGOOSE_MAX_RETRIES, 10) || 5,
  MONGOOSE_RETRY_INTERVAL: parseInt(process.env.MONGOOSE_RETRY_INTERVAL, 10) || 5000,
};

const CORS_WHITELIST = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000"];

/**
 * Logging Configuration
 */
// Ensure logs directory exists
if (!fs.existsSync("logs")) {
  fs.mkdirSync("logs", { recursive: true });
}

const logger = winston.createLogger({
  level: NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return JSON.stringify({ timestamp, level, instance: INSTANCE_ID, message, stack });
    })
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.colorize({ all: true }) }),
    new winston.transports.File({
      filename: `logs/error-${INSTANCE_ID}.log`,
      level: "error",
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: `logs/combined-${INSTANCE_ID}.log`,
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

/**
 * Database Connection
 */
async function connectMongoDB() {
  if (!MONGODB_URI) {
    logger.error("MongoDB URI is missing");
    process.exit(1);
  }

  const connectWithRetry = async (retries = SECURITY_CONFIG.MONGOOSE_MAX_RETRIES) => {
    try {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        autoIndex: NODE_ENV !== "production",
        maxPoolSize: 10,
      });
      logger.info("✅ MongoDB connected successfully");
    } catch (error) {
      if (retries > 0) {
        logger.warn(`⚠️ MongoDB connection failed, retrying... (${retries} attempts left)`);
        setTimeout(() => connectWithRetry(retries - 1), SECURITY_CONFIG.MONGOOSE_RETRY_INTERVAL);
      } else {
        logger.error("❌ MongoDB connection failed after all retries");
        process.exit(1);
      }
    }
  };

  mongoose.connection.on("connected", () => logger.info("✅ MongoDB connection established"));
  mongoose.connection.on("disconnected", () => {
    logger.warn("⚠️ MongoDB disconnected, attempting to reconnect...");
    connectWithRetry();
  });
  mongoose.connection.on("error", (error) => logger.error(`❌ MongoDB Error: ${error.message}`));

  await connectWithRetry();
}

/**
 * Express App Configuration
 */

const app = express();

app.use((req, res, next) => {
  if (!req || typeof req !== 'object' || !req.method || !req.url) {
    // Use raw Node.js response methods to avoid potential Express issues
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      status: 'error',
      message: 'Malformed request'
    }));
    return;
  }
  next();
});

app.use(express.json({ limit: SECURITY_CONFIG.MAX_REQUEST_SIZE }));
app.use(express.urlencoded({ extended: true, limit: SECURITY_CONFIG.MAX_REQUEST_SIZE }));

app.use(helmet({ contentSecurityPolicy: NODE_ENV === "production" }));
app.use(compression());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || (NODE_ENV !== "production") || CORS_WHITELIST.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    maxAge: 86400, // 24 hours
  })
);

app.use((req, res, next) => {
  logger.info(`Request: ${req.method} ${req.path}`);
  next();
});

const globalRateLimiter = rateLimit({
  windowMs: SECURITY_CONFIG.RATE_LIMIT_WINDOW,
  max: SECURITY_CONFIG.RATE_LIMIT_MAX,
  message: { status: "error", message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalRateLimiter);

/**
 * Application Routes
 */

app.get("/health", (req, res) => {
  try {
    const healthData = {
      status: "success",
      service: "Bleu.js Backend",
      version: VERSION,
      build: BUILD_NUMBER,
      instance: INSTANCE_ID,
      port: PORT,
      uptime: Math.floor(process.uptime()),
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + "MB",
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
      },
      timestamp: new Date().toISOString(),
      mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(healthData));
  } catch (error) {
    logger.error("Health check error:", error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: "error",
      message: "Health check failed",
      error: NODE_ENV === "production" ? undefined : error.message
    }));
  }
});

app.get("/api", (req, res) => {
  try {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: "success",
      message: "Welcome to Bleu.js API",
      version: VERSION,
      environment: NODE_ENV
    }));
  } catch (error) {
    logger.error(`API root error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: "error", message: "API error" }));
  }
});

const apiRouter = express.Router();
apiRouter.get("/status", (req, res) => {
  try {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: "online" }));
  } catch (error) {
    logger.error(`Status endpoint error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: "error", message: "Status check failed" }));
  }
});


app.use("/api/v1", apiRouter);


app.use((req, res) => {
  logger.warn(`404 - Not Found: ${req.method} ${req.originalUrl}`);

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: "error",
    message: "Resource not found",
    path: req.originalUrl
  }));
});


app.use((err, req, res, next) => {
  const errorId = crypto.randomUUID();

  logger.error(`Unhandled Error: ${err.message}`, {
    errorId,
    stack: err.stack,
    path: req?.path || 'unknown',
    method: req?.method || 'unknown',
  });

  try {
    res.writeHead(err.status || 500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: "error",
      message: NODE_ENV === "production" ? "Internal server error" : err.message,
      errorId,
      timestamp: new Date().toISOString(),
    }));
  } catch (finalError) {
    logger.error(`Error handler failed: ${finalError.message}`);

    // Final fallback using raw Node methods
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end("Internal Server Error");
    }
  }
});

/**
 * Server Initialization and Lifecycle Management
 */
// Create HTTP server instance
const server = http.createServer(app);


const startServer = async () => {
  try {

    await connectMongoDB();


    server.listen(PORT, () => {
      logger.info(`🚀 Server running at http://localhost:${PORT} in ${NODE_ENV} mode`);


      if (process.send) {
        process.send('ready');
        logger.info(`Process ${INSTANCE_ID} signaled ready state`);
      }
    });

    server.timeout = SECURITY_CONFIG.CONNECTION_TIMEOUT;


    server.on('error', (error) => {
      logger.error(`Server Error: ${error.message}`);
      process.exit(1);
    });


    logger.info("✅ Routes loaded successfully");

  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};


const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, shutting down process ${INSTANCE_ID}`);

  const forceExitTimeout = setTimeout(() => {
    logger.error(`Forced exit after timeout for process ${INSTANCE_ID}`);
    process.exit(1);
  }, 10000);

  try {

    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) {
          logger.error(`Error closing HTTP server: ${err.message}`);
          reject(err);
        } else {
          logger.info(`✅ HTTP server on port ${PORT} closed`);
          resolve();
        }
      });
    });


    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      logger.info(`✅ MongoDB connection closed for process ${INSTANCE_ID}`);
    }


    clearTimeout(forceExitTimeout);


    if (process.send) {
      process.send('shutdown');
    }

    process.exit(0);
  } catch (error) {
    logger.error(`Shutdown Error in process ${INSTANCE_ID}: ${error.message}`);
    process.exit(1);
  }
};


process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));


process.on("uncaughtException", (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled Rejection: ${reason instanceof Error ? reason.message : reason}`);
  process.exit(1);
});


startServer().catch((error) => {
  logger.error(`Server initialization failed: ${error.message}`);
  process.exit(1);
});

export default app;
