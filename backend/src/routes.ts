import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { createLogger, format, transports } from "winston";
import aiService from "./services/aiService.js.js";

// ✅ Logger Setup
const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [new transports.Console()],
});

// ✅ Initialize Router & Multer
const router: Router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * ✅ Middleware to Handle Errors
 */
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * ✅ Debugging Route
 */
router.post("/debug", (req: Request, res: Response<any>) => {
  logger.info("Debug endpoint hit", { endpoint: "/debug", ip: req.ip });
  res.status(200).json({ message: "Debugging" });
});

/**
 * ✅ Optimization Route
 */
router.post("/optimize", (req: Request, res: Response<any>) => {
  logger.info("Optimize endpoint hit", { endpoint: "/optimize", ip: req.ip });
  res.status(200).json({ message: "Optimizing" });
});

/**
 * ✅ Generation Route
 */
router.post("/generate", (req: Request, res: Response<any>) => {
  logger.info("Generate endpoint hit", { endpoint: "/generate", ip: req.ip });
  res.status(200).json({ message: "Generating" });
});

/**
 * ✅ Data Handling Route
 */
router.post(
  "/data",
  upload.none(),
  asyncHandler(async (req: Request, res: Response<any>) => {
    const { data } = req.body;
    if (!data) {
      logger.warn("Bad Request: No data provided", { endpoint: "/data", ip: req.ip });
      return res.status(400).json({ message: "Bad Request: No data provided" });
    }

    // Simulate error handling
    if (data === "Async Error") throw new Error("Simulated Async Error");

    logger.info("Data received", { endpoint: "/data", data, ip: req.ip });
    res.status(201).json({ message: "Data received", data });
  })
);

/**
 * ✅ AI Rules Routes
 */
router.post(
  "/api/rules",
  asyncHandler(async (req: Request, res: Response<any>) => {
    await aiService.addRule(req.body);
    res.status(201).json({ message: "Rule added successfully" });
  })
);

router.delete(
  "/api/rules/:id",
  asyncHandler(async (req: Request, res: Response<any>) => {
    await aiService.removeRule(req.params.id);
    res.status(200).json({ message: "Rule removed successfully" });
  })
);

router.put(
  "/api/rules/:id",
  asyncHandler(async (req: Request, res: Response<any>) => {
    await aiService.updateRule(req.params.id, req.body);
    res.status(200).json({ message: "Rule updated successfully" });
  })
);

router.post(
  "/api/rules/evaluate",
  asyncHandler(async (req: Request, res: Response<any>) => {
    const result = await aiService.evaluateRules(req.body);
    res.status(200).json({ result });
  })
);

/**
 * ✅ AI Processing Routes
 */
router.post(
  "/api/ai/predict",
  asyncHandler(async (req: Request, res: Response<any>) => {
    const result = await aiService.predictDecision(req.body);
    res.status(200).json({ result });
  })
);

router.post(
  "/api/ai/process-text",
  asyncHandler(async (req: Request, res: Response<any>) => {
    const result = await aiService.processText(req.body.text);
    res.status(200).json({ result });
  })
);

router.post(
  "/api/ai/process-text-advanced",
  asyncHandler(async (req: Request, res: Response<any>) => {
    const result = await aiService.processTextAdvanced(req.body.text, req.body.options);
    res.status(200).json({ result });
  })
);

/**
 * ❌ 404 Handler
 */
router.use((req: Request, res: Response<any>) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`, { ip: req.ip });
  res.status(404).json({ message: "Resource not found" });
});

/**
 * ❌ Error Handling Middleware
 */
router.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Internal Server Error: ${err.message}`, { endpoint: req.originalUrl, ip: req.ip });
  res.status(500).json({ message: "Internal Server Error", error: err.message });
});

export default router;
