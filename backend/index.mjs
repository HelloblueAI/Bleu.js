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

import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import winston from "winston";

import compression from "compression";

import http from "http";
import os from "os";
import { getSecrets } from "./src/config/awsSecrets.js";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/** 📌 Application Config */
let secrets = {};
let appConfig = {};

/** 🔄 Bootstrap Config */
async function bootstrapConfig() {
  try {
    secrets = await getSecrets();

    appConfig = {
      VERSION: secrets.npm_package_version || "1.1.2",
      BUILD_NUMBER: secrets.BUILD_NUMBER || "0",
      PORT: parseInt(secrets.PORT, 10) || 5007,
      MONGODB_URI: secrets.MONGODB_URI || "",
      INSTANCE_ID: secrets.INSTANCE_ID || secrets.NODE_APP_INSTANCE || "0",
      NODE_ENV: secrets.NODE_ENV || "development",
      IS_PM2: typeof process.env.PM2_HOME !== "undefined",
      SECURITY: {
        MAX_REQUEST_SIZE: secrets.MAX_REQUEST_SIZE || "5mb",
        CONNECTION_TIMEOUT: parseInt(secrets.CONNECTION_TIMEOUT, 10) || 10000,
      },
      CORS_WHITELIST: secrets.ALLOWED_ORIGINS
        ? secrets.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
        : ["http://localhost:3000"],
    };

    return true;
  } catch (error) {
    console.error("❌ Failed to load configuration:", error.message);
    process.exit(1);
  }
}

/** 📝 Logger Setup */
function setupLogging() {
  const logsDir = path.join(__dirname, "logs");
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

  const logger = winston.createLogger({
    level: appConfig.NODE_ENV === "production" ? "info" : "debug",
    format: winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: "bleu-backend", instance: appConfig.INSTANCE_ID },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
        ),
      }),
      new winston.transports.File({ filename: path.join(logsDir, "error.log"), level: "error" }),
      new winston.transports.File({ filename: path.join(logsDir, "combined.log") }),
    ],
    exceptionHandlers: [
      new winston.transports.File({ filename: path.join(logsDir, "exceptions.log") }),
    ],
    exitOnError: false,
  });

  return logger;
}

/** 🔌 MongoDB Connection */
async function connectMongoDB(logger) {
  if (!appConfig.MONGODB_URI) {
    logger.error("❌ MongoDB URI is missing");
    process.exit(1);
  }

  try {
    await mongoose.connect(appConfig.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    mongoose.connection.on("error", (err) => logger.error(`❌ MongoDB error: ${err}`));
    mongoose.connection.on("disconnected", () => logger.warn("⚠️ MongoDB disconnected"));
    mongoose.connection.on("reconnected", () => logger.info("✅ MongoDB reconnected"));

    logger.info("✅ MongoDB connected successfully");
  } catch (error) {
    logger.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
}

/** 🏥 Health Check Endpoints */
function configureHealthEndpoints(app, logger) {
  app.get("/health", (req, res) => {
    try {
      res.status(200).json({
        status: "success",
        service: "Bleu.js Backend",
        version: appConfig.VERSION,
        instance: appConfig.INSTANCE_ID,
        memory: getMemoryStats(),
        system: getSystemStats(),
        environment: appConfig.NODE_ENV,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Health check failed",
        error: error.message,
      });
      logger.error("❌ Health check endpoint error:", error);
    }
  });
}

/** 📚 Swagger Documentation Setup */
function configureSwagger(app, logger) {
  // 📌 Swagger Configuration
  const swaggerOptions = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Bleu.js API",
        version: appConfig.VERSION,
        description: "API documentation for the Bleu.js backend deployed on AWS API Gateway.",
      },
      servers: [
        {
          url: `http://localhost:${appConfig.PORT}`,
        },
        {
          url: "https://mozxitsnsh.execute-api.us-west-2.amazonaws.com/prod",
          description: "AWS API Gateway (Production)",
        },
      ],
    },
    apis: ["./routes/*.js"], // Ensure routes are documented correctly
  };


  // Generate Swagger Docs
  const swaggerDocs = swaggerJsdoc(swaggerOptions);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  logger.info(`📖 Swagger UI available at: http://localhost:${appConfig.PORT}/api-docs`);
}

/** 🛡️ Security Middleware */
function configureSecurityMiddleware(app, logger) {
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || appConfig.CORS_WHITELIST.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`❌ Blocked by CORS: ${origin}`);
        callback(new Error("❌ Not allowed by CORS"));
      }
    },
    credentials: true,
  }));

  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: appConfig.SECURITY.MAX_REQUEST_SIZE }));
}

/** 🚀 Start Express Server */
async function startServer(logger) {
  const app = express();
  configureSecurityMiddleware(app, logger);
  configureHealthEndpoints(app, logger);
  configureSwagger(app, logger);

  const server = http.createServer(app);

  server.listen(appConfig.PORT, () => {
    logger.info(`🚀 Server running at http://localhost:${appConfig.PORT} in ${appConfig.NODE_ENV} mode`);
  });

  return server;
}

/** 📊 System Metrics */
function getMemoryStats() {
  return {
    rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(process.memoryUsage().external / 1024 / 1024)}MB`,
  };
}

function getSystemStats() {
  return {
    load: os.loadavg(),
    cpu_count: os.cpus().length,
    free_mem: `${Math.round(os.freemem() / 1024 / 1024)}MB`,
    total_mem: `${Math.round(os.totalmem() / 1024 / 1024)}MB`,
  };
}

/** 🏃‍♂️ Bootstrap Application */
async function bootstrap() {
  await bootstrapConfig();
  const logger = setupLogging();
  await connectMongoDB(logger);
  await startServer(logger);
}

bootstrap().catch((err) => {
  console.error("❌ Fatal error during bootstrap:", err);
  process.exit(1);
});

export default bootstrap;
