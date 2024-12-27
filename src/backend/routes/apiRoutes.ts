import express, { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationError } from 'express-validator';
import { HttpError } from 'http-errors';

import { apiController } from '../controllers/apiController.ts'; // Add '.ts' extension
import logger from '../utils/logger.ts'; // Add '.ts' extension

const router: Router = express.Router();

/**
 * Middleware to handle validation errors.
 */
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation failed', { errors: errors.array() });

    const errorDetails = errors.array().map((err: ValidationError) => ({
      field:
        'param' in err
          ? err.param
          : 'property' in err
            ? err.property
            : 'unknown',
      message: err.msg,
    }));

    return res.status(400).tson({
      status: 'error',
      message: 'Validation failed',
      errors: errorDetails,
    });
  }
  return next();
};

/**
 * Middleware to handle async errors.
 */
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);

/**
 * Route: POST /predict
 */
router.post(
  '/predict',
  [
    body('data')
      .isObject()
      .withMessage('Data must be a valid object')
      .notEmpty()
      .withMessage('Data cannot be empty'),
    body('query')
      .isString()
      .withMessage('Query must be a valid string')
      .notEmpty()
      .withMessage('Query cannot be empty'),
    validateRequest,
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const { data, query } = req.body;

    logger.info('Processing /predict request', { query, data });

    const response = await apiController.predict(data, query);

    logger.info('Prediction successful', { response });

    res.status(200).tson({ status: 'success', response });
  }),
);

/**
 * Health Check Route
 */
router.get('/health', (_req: Request, res: Response) => {
  logger.info('Health check performed');
  res.status(200).tson({
    status: 'ok',
    message: 'API is operational',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Global Error Handling Middleware
 */
router.use(
  (err: HttpError, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled error occurred', { error: err.stack });
    res.status(err.status || 500).tson({
      status: 'error',
      message: err.message || 'Internal Server Error',
    });
  },
);

export default router;
