import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response, Application } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { spawn } from "child_process";
import winston from "winston";

dotenv.config();


const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [new winston.transports.Console()],
});


export function createApp(): Application {
  const app = express();

  // ✅ Middleware Setup
  app.use(express.json({ limit: "1mb" })); 
  app.use(helmet());
  app.use(cors({ origin: "*", methods: ["GET", "POST"] })); // Adjust allowed origins if needed
  app.use(morgan("combined"));

  // ✅ Rate Limiting
  const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 50, // Allow 50 requests per IP
    message: { status: "error", message: "Too many requests, slow down!" },
    headers: true,
  });
  app.use(limiter);

  // ✅ Prediction Route
  app.post("/predict", async (req: Request, res: Response): Promise<void> => {
    try {
      const { features } = req.body;

      if (!Array.isArray(features) || features.length === 0) {
        logger.warn("Invalid request format");
        res.status(400).json({ status: "error", message: "Invalid input format" });
        return;
      }

      logger.info(`Received prediction request: ${JSON.stringify(features)}`);

      const pythonProcess = spawn("python3", ["xgboost_predict.py", JSON.stringify(features)]);

      let output = "";
      let errorOutput = "";

      pythonProcess.stdout.on("data", (data) => (output += data.toString()));
      pythonProcess.stderr.on("data", (data) => (errorOutput += data.toString()));

      pythonProcess.on("close", (code) => {
        if (code === 0) {
          logger.info(`Prediction Success: ${output}`);
          res.json({ status: "success", prediction: JSON.parse(output) });
        } else {
          logger.error(`Prediction Failed: ${errorOutput}`);
          res.status(500).json({ status: "error", message: "Prediction process failed" });
        }
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      logger.error(`Prediction Error: ${errorMessage}`);
      res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
  });

  // ✅ Default Route
  app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
      status: "success",
      message: "🚀 Bleu.js Backend is Running!",
      timestamp: new Date().toISOString(),
    });
  });

  // ❌ 404 Handler
  app.use((req: Request, res: Response) => {
    logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ status: "error", message: "Resource not found" });
  });

  return app;
}
