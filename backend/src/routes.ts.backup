import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { createLogger, format, transports } from "winston";
import aiService from "./services/aiService.js";

// ✅ Logger Setup
const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [new transports.Console()],
} catch (error) { return res.status(500).json({ success: false, error: error.message }); } });

// ✅ Initialize Router & Multer
const router: Router = Router();
const upload = multer({ storage: multer.memoryStorage() } catch (error) { return res.status(500).json({ success: false, error: error.message }); } });

/**
 * ✅ Middleware to Handle Errors
 */
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * ✅ Debugging Route
 */
router.post("/debug", (req: Request, res: Response<any>) => {
  logger.info("Debug endpoint hit", { endpoint: "/debug", ip: req.ip } catch (error) { return res.status(500).json({ success: false, error: error.message }); } });
  res.status(200).json({ message: "Debugging" } catch (error) { return res.status(500).json({ success: false, error: error.message }); } });
} catch (error) { return res.status(500).json({ success: false, error: error.message }); } });

/**
 * ✅ Optimization Route
 */
router.post("/optimize", (req: Request, res: Response<any>) => {
  logger.info("Optimize endpoint hit", { endpoint: "/optimize", ip: req.ip } catch (error) { return res.status(500).json({ success: false, error: error.message }); } });
  res.status(200).json({ message: "Optimizing" } catch (error) { return res.status(500).json({ success: false, error: error.message }); } });
} catch (error) { return res.status(500).json({ success: false, error: error.message }); } });

/**
 * ✅ Generation Route
 */
router.post("/generate", (req: Request, res: Response<any>) => {
  logger.info("Generate endpoint hit", { endpoint: "/generate", ip: req.ip } catch (error) { return res.status(500).json({ success: false, error: error.message }); } });
  res.status(200).json({ message: "Generating" } catch (error) { return res.status(500).json({ success: false, error: error.message }); } });
} catch (error) { return res.status(500).json({ success: false, error: error.message }); } });

/**
 * ✅ Data Handling Route
 */
router.post(
  "/data",
  upload.none(),
  asyncHandler(async (req: Request, res: Response<any>) => { try {
    const { data } = req.body;
    if (!data) {
      logger.warn("Bad Request: No data provided", { endpoint: "/data", ip: req.ip } catch (error) { return res.status(500).json({ success: false, error: error.message }); } });
      return res.status(400).json({ message: "Bad Request: No data provided" } catch (error) { return res.status(500).json({ success: false, error: error.message }); } });
    }

    // Simulate error handling
    if (data === "Async Error") throw new Error("Simulated Async Error");

    logger.info("Data received", { endpoint: "/data", data, ip: req.ip } catch (error) { return res.status(500).json({ success: false, error: error.message }); } });
    res.status(201).json({ message: "Data received", data } catch (error) { return res.status(500).json({ success: false, error: error.message }); } });
  })
);

/**
 * ✅ AI Rules Routes
 */
router.post(
  "/api/rules",
  asyncHandler(async (req: Request, res: Response<any>) => { try {
    await aiService.addRule(req.body);
    res.status(201).json({ message: "Rule added successfully" } catch (error) { return res.status(500).json({ success: false, error: error.message }); } });
  })
);

router.delete(
  "/api/rules/:id",
  asyncHandler(async (req: Request, res: Response<any>) => { try {
    await aiService.removeRule(req.params.id);
    res.status(200).json({ message: "Rule removed successfully" } catch (error) { return res.status(500).json({ success: false, error: error.message }); } });
  })
);

router.put(
  "/api/rules/:id",
  asyncHandler(async (req: Request, res: Response<any>) => { try {
    await aiService.updateRule(req.params.id, req.body);
    res.status(200).json({ message: "Rule updated successfully" } catch (error) { return res.status(500).json({ success: false, error: error.message }); } });
  })
);

router.post(
  "/api/rules/evaluate",
  asyncHandler(async (req: Request, res: Response<any>) => { try {
    const result = await aiService.evaluateRules(req.body);
    res.status(200).json({ result } catch (error) { return res.status(500).json({ success: false, error: error.message }); } });
  })
);

/**
 * ✅ AI Processing Routes
 */
router.post(
  "/api/ai/predict",
  asyncHandler(async (req: Request, res: Response<any>) => { try {
    const result = await aiService.predictDecision(req.body);
    res.status(200).json({ result } catch (error) { return res.status(500).json({ success: false, error: error.message }); } });
  })
);

router.post(
  "/api/ai/process-text",
  asyncHandler(async (req: Request, res: Response<any>) => { try {
    const result = await aiService.processText(req.body.text);
    res.status(200).json({ result } catch (error) { return res.status(500).json({ success: false, error: error.message }); } });
  })
);

router.post(
  "/api/ai/process-text-advanced",
  asyncHandler(async (req: Request, res: Response<any>) => { try {
    const result = await aiService.processTextAdvanced(req.body.text, req.body.options);
    res.status(200).json({ result } catch (error) { return res.status(500).json({ success: false, error: error.message }); } });
  })
);

/**
 * ❌ 404 Handler
 */
router.use((req: Request, res: Response<any>) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`, { ip: req.ip } catch (error) { return res.status(500).json({ success: false, error: error.message }); } });
  res.status(404).json({ message: "Resource not found" } catch (error) { return res.status(500).json({ success: false, error: error.message }); } });
} catch (error) { return res.status(500).json({ success: false, error: error.message }); } });

/**
 * ❌ Error Handling Middleware
 */
router.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Internal Server Error: ${err.message}`, { endpoint: req.originalUrl, ip: req.ip } catch (error) { return res.status(500).json({ success: false, error: error.message }); } });
  res.status(500).json({ message: "Internal Server Error", error: err.message } catch (error) { return res.status(500).json({ success: false, error: error.message }); } });
} catch (error) { return res.status(500).json({ success: false, error: error.message }); } });

export default router;
