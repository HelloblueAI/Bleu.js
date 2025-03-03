// src/src/ml/xgboostService.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

/**
 * Prediction result from the XGBoost model
 */
export interface PredictionResult {
  prediction: number;
  confidence: number;
  probabilities: number[];
  error?: string;
}

/**
 * Model health information
 */
export interface ModelHealth {
  status: string;
  model_loaded: boolean;
  scaler_loaded: boolean;
  prediction_count: number;
  feature_count: number;
  loaded_at: string;
  last_prediction_time: string | null;
  error?: string;
}

/**
 * Predict using the XGBoost model via Python script
 * @param features - Array of feature values
 * @returns Prediction result with class and confidence
 */
export async function predictWithXGBoost(features: number[]): Promise<PredictionResult> {
  try {
    // Convert features to JSON string
    const featuresJson = JSON.stringify(features);

    // Get absolute path to the inference script
    const scriptPath = path.resolve(__dirname, '../../../inference.py');

    // Call the Python script
    const { stdout, stderr } = await execPromise(`python ${scriptPath} '${featuresJson}'`);

    if (stderr && !stderr.includes('INFO')) {
      console.error('XGBoost inference stderr:', stderr);
    }

    // Parse the result
    return JSON.parse(stdout);
  } catch (error) {
    console.error('Error calling XGBoost model:', error instanceof Error ? error.message : error);
    throw new Error(`XGBoost prediction failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check the health of the XGBoost model
 * @returns Health status information
 */
export async function checkModelHealth(): Promise<ModelHealth> {
  try {
    const scriptPath = path.resolve(__dirname, '../../../inference.py');
    const { stdout, stderr } = await execPromise(`python ${scriptPath} --health`);

    if (stderr && !stderr.includes('INFO')) {
      console.error('XGBoost health check stderr:', stderr);
    }

    return JSON.parse(stdout);
  } catch (error) {
    console.error('Error checking XGBoost model health:', error instanceof Error ? error.message : error);
    throw new Error(`XGBoost health check failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
