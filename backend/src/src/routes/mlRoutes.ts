// src/src/routes/mlRoutes.ts
import { Router } from 'express';
import * as mlController from '../controllers/mlController.js';

// Fix for the TypeScript error about router type
const router: Router = Router();

// XGBoost model endpoints
router.post('/predict', mlController.predict);
router.get('/health', mlController.health);

export default router;
