// src/src/controllers/mlController.ts
import { Request, Response } from 'express';
import { predictWithXGBoost, checkModelHealth } from '../ml/xgboostService.js';

/**
 * Get a prediction from the XGBoost model
 */
export async function predict(req: Request, res: Response): Promise<void> {
  try {
    const features = req.body.features;

    // Validate input
    if (!Array.isArray(features) || features.length !== 10) {
      res.status(400).json({
        error: 'Invalid input: expected array of 10 numeric features'
      });
      return;
    }

    // Check that all features are numbers
    if (!features.every(f => typeof f === 'number')) {
      res.status(400).json({
        error: 'Invalid input: all features must be numbers'
      });
      return;
    }

    // Call prediction service
    const result = await predictWithXGBoost(features);

    // Return result
    res.json(result);
  } catch (error) {
    console.error('Prediction failed:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: `Prediction failed: ${error instanceof Error ? error.message : String(error)}` });
  }
}

/**
 * Get the health status of the XGBoost model
 */
export async function health(req: Request, res: Response): Promise<void> {
  try {
    const healthInfo = await checkModelHealth();
    res.json(healthInfo);
  } catch (error) {
    console.error('Health check failed:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: `Health check failed: ${error instanceof Error ? error.message : String(error)}` });
  }
}
