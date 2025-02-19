//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is granted, free of charge, to use, modify, and distribute this software
//  under the following conditions:
//  1. This copyright notice and permission notice must be included in all copies.
//  2. Contributions must follow the project's contribution guidelines.
//  3. "Helloblue Inc." and contributors' names may not be used for endorsements without consent.
//  4. THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND.

import { spawn } from "child_process";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import os from "os";

import winston from "winston";
import getPort from "get-port";
import path from "path";
import fs from "fs";

dotenv.config();

const DEFAULT_PORT = process.env.PORT ?? 5005;
const MONGODB_URI = process.env.MONGODB_URI ?? "";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/app.log" }),
  ],
});

logger.info("🚀 Server is initializing...");

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(helmet());
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(morgan("tiny", { stream: { write: (msg) => logger.info(msg.trim()) } }));

/**
 * 🎯 Predict Route - Calls Python XGBoost Model
 */
app.post("/predict", async (req, res) => {
  try {
    const { features } = req.body;

    if (!Array.isArray(features) || features.length === 0) {
      logger.warn("⚠️ Invalid request format");
      return res.status(400).json({ status: "error", message: "Invalid input format" });
    }

    logger.info(`📡 Prediction Request: ${JSON.stringify(features)}`);

    const startTime = process.hrtime();
    const scriptPath = path.join(__dirname, "xgboost_predict.py");

    // ✅ Ensure script exists before execution
    if (!fs.existsSync(scriptPath)) {
      return res.status(500).json({ status: "error", message: "❌ Prediction script not found" });
    }

    const pythonProcess = spawn("python3", [scriptPath, JSON.stringify(features)], {
      env: { ...process.env, PATH: `/home/ec2-user/Bleu.js/backend/venv/bin:${process.env.PATH}` },
    });

    let output = "";
    let errorOutput = "";
    let responseSent = false; // 🛑 Ensure res.json() is only called once

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString().trim();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString().trim();
    });

    pythonProcess.on("close", (code) => {
      const endTime = process.hrtime(startTime);
      const executionTime = (endTime[0] * 1000 + endTime[1] / 1e6).toFixed(2);

      if (responseSent) return; // 🛑 Prevent duplicate responses

      if (code === 0) {
        try {
          if (!output) throw new Error("Empty response from model");
          const parsedOutput = JSON.parse(output);

          logger.info(`✅ Prediction Success in ${executionTime}ms: ${JSON.stringify(parsedOutput)}`);
          responseSent = true;
          return res.json({ status: "success", prediction: parsedOutput });
        } catch (parseError) {
          logger.error(`❌ JSON Parsing Error: ${parseError.message}`);
          responseSent = true;
          return res.status(500).json({ status: "error", message: "Invalid response format from Python script" });
        }
      } else {
        logger.error(`❌ Prediction Failed: ${errorOutput}`);
        responseSent = true;
        return res.status(500).json({ status: "error", message: "Prediction process failed" });
      }
    });

    pythonProcess.on("error", (error) => {
      if (!responseSent) {
        responseSent = true;
        logger.error(`❌ Python Process Error: ${error.message}`);
        res.status(500).json({ status: "error", message: "Internal Server Error" });
      }
    });

  } catch (error) {
    logger.error(`❌ Prediction Error: ${error.message}`);
    if (!res.headersSent) {
      res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
  }
});

/**
 * 🏠 Root Endpoint - Health Check
 */
app.get("/", (_req, res) => {
  res.status(200).json({
    status: "success",
    message: "🚀 Bleu.js Backend is Running!",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    server: os.hostname(),
  });
});

/**
 * 🛑 404 Handler
 */
app.use((req, res) => {
  logger.warn(`⚠️ 404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ status: "error", message: "Resource not found" });
});

/**
 * 🔥 Start Server
 */
(async () => {
  try {
    const PORT = await getPort({ port: [DEFAULT_PORT, 5006, 5007, 5008] });
    const server = app.listen(PORT, () => {
      logger.info(`✅ Server running on http://localhost:${PORT} (Production Mode)`);
    });

    /**
     * 🛑 Graceful Shutdown
     */
    const shutdown = async (signal) => {
      try {
        logger.warn(`🛑 Received ${signal}. Shutting down gracefully...`);
        await mongoose.connection.close();
        logger.info("🛑 MongoDB Connection closed.");
        server.close(() => {
          logger.info("✅ Server closed.");
          process.exit(0);
        });
      } catch (err) {
        logger.error(`❌ MongoDB Shutdown Error: ${err.message}`);
        process.exit(1);
      }
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("uncaughtException", (err) => {
      logger.error(`❌ Uncaught Exception: ${err.stack}`);
      process.exit(1);
    });
    process.on("unhandledRejection", (err) => {
      logger.error(`❌ Unhandled Rejection: ${err.stack}`);
    });
  } catch (err) {
    logger.error(`❌ Fatal Error: ${err.message}`);
    process.exit(1);
  }
})();
