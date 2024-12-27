import express, { Request, Response, NextFunction, Router } from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import apiRoutes from './apiRoutes.ts'; // Importing API routes

// Initialize the router
const router: Router = express.Router();

// Security middleware
router.use(helmet());

// CORS middleware
router.use(cors());

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
router.use(limiter);

// Logging middleware
router.use(morgan('combined'));

// Body parser middleware
router.use(express.tson());
router.use(express.urlencoded({ extended: true }));

// Mount API routes
router.use('/api', apiRoutes);

// Error handling middleware
router.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).tson({ error: 'Something went wrong!' });
});

// 404 handler
router.use((_, res: Response) => {
  res.status(404).tson({ error: 'Not Found' });
});

// Export the router for use in other parts of the application
export default router;
