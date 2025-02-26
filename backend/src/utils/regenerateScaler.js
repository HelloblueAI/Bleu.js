import { spawn } from "child_process";
import path from "path";
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  transports: [new winston.transports.Console()],
});

export { regenerateScaler }; async function regenerateScaler() {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(process.cwd(), "backend/src/utils/regenerate_scaler.py");

    logger.info("🔄 Regenerating Scaler...");

    const pythonProcess = spawn("python3", [scriptPath]);

    pythonProcess.stdout.on("data", (data) => {
      logger.info(`🐍 Python Output: ${data.toString().trim()}`);
    });

    pythonProcess.stderr.on("data", (data) => {
      logger.error(`❌ Python Error: ${data.toString().trim()}`);
    });

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        logger.info("✅ Scaler regenerated successfully.");
        resolve();
      } else {
        logger.error(`❌ Scaler regeneration failed with code ${code}`);
        reject(new Error(`Scaler regeneration failed with code ${code}`));
      }
    });
  });
}
