import { spawn } from "child_process";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import getPort from "get-port";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import os from "os";
import Prometheus from "prom-client";
import winston from "winston";

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
    new winston.transports.File({ filename: "logs/app.log" })
  ],
});

logger.info("🚀 Server is initializing...");

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(helmet());
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(morgan("tiny", { stream: { write: (msg) => logger.info(msg.trim()) } }));


const validApiKeys = new Set([
  process.env.FREE_API_KEY || "free-demo-key",
  process.env.PREMIUM_API_KEY || "premium-secret-key"
]);

app.use((req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || !validApiKeys.has(apiKey)) {
    return res.status(403).json({ status: "error", message: "Unauthorized API key" });
  }
  next();
});
const requestLog = new Map();
const requestThreshold = 50;
const anomalyDetectionInterval = 60000; // 1 min

app.use((req, res, next) => {
  const ip = req.ip;
  requestLog.set(ip, (requestLog.get(ip) || 0) + 1);
  next();
});

setInterval(() => {
  requestLog.forEach((count, ip) => {
    if (count > requestThreshold) {
      logger.warn(`🚨 Anomaly Detected! IP: ${ip}, Requests: ${count}`);
    }
  });
  requestLog.clear();
}, anomalyDetectionInterval);


const rateLimits = {
  free: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: { status: "error", message: "⚠️ Too many requests. Upgrade to premium." },
  }),
  premium: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
  }),
};

app.use((req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey === process.env.PREMIUM_API_KEY) {
    rateLimits.premium(req, res, next);
  } else {
    rateLimits.free(req, res, next);
  }
});


const connectWithRetry = (retries = 5) => {
  mongoose
    .connect(MONGODB_URI)
    .then(() => logger.info("🔥 Connected to MongoDB"))
    .catch((err) => {
      logger.error(`❌ MongoDB Connection Error: ${err.message}`);
      if (retries > 0) {
        setTimeout(() => connectWithRetry(retries - 1), 5000);
      }
    });
};
connectWithRetry();

Prometheus.collectDefaultMetrics({ timeout: 5000 });

const requestCount = new Prometheus.Counter({
  name: "http_requests_total",
  help: "Total HTTP Requests",
  labelNames: ["method", "route", "status"],
});

app.use((req, res, next) => {
  res.on("finish", () => {
    requestCount.labels(req.method, req.path, res.statusCode).inc();
  });
  next();
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", Prometheus.register.contentType);
  res.end(await Prometheus.register.metrics());
});
app.post("/predict", async (req, res) => {
  try {
    const { features } = req.body;

    if (!Array.isArray(features) || features.length === 0) {
      logger.warn("⚠️ Invalid request format");
      return res.status(400).json({ status: "error", message: "Invalid input format" });
    }

    logger.info(`📡 Prediction Request: ${JSON.stringify(features)}`);

    const startTime = process.hrtime();
    const pythonProcess = spawn("python3", ["xgboost_predict.py", JSON.stringify(features)]);

    let output = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => (output += data.toString()));
    pythonProcess.stderr.on("data", (data) => (errorOutput += data.toString()));

    pythonProcess.on("close", (code) => {
      const endTime = process.hrtime(startTime);
      const executionTime = (endTime[0] * 1000 + endTime[1] / 1e6).toFixed(2);

      if (code === 0) {
        logger.info(`✅ Prediction Success in ${executionTime}ms: ${output}`);
        res.json({ status: "success", prediction: JSON.parse(output) });
      } else {
        logger.error(`❌ Prediction Failed: ${errorOutput}`);
        res.status(500).json({ status: "error", message: "Prediction process failed" });
      }
    });
  } catch (error) {
    logger.error(`❌ Prediction Error: ${error.message}`);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});


app.get("/", (_req, res) => {
  res.status(200).json({
    status: "success",
    message: "🚀 Bleu.js Backend is Running!",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    server: os.hostname(),
  });
});


app.use((req, res) => {
  logger.warn(`⚠️ 404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ status: "error", message: "Resource not found" });
});

(async () => {
  const PORT = await getPort({ port: [DEFAULT_PORT, 5006, 5007, 5008] });

  const server = app.listen(PORT, () => {
    logger.info(`✅ Server running on http://localhost:${PORT} (Production Mode)`);
  });


  const shutdown = (signal) => {
    logger.warn(`🛑 Received ${signal}. Shutting down gracefully...`);

    mongoose.connection.close(() => {
      logger.info("🛑 MongoDB Connection closed.");
      server.close(() => {
        logger.info("✅ Server closed.");
        process.exit(0);
      });
    });
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
})();
