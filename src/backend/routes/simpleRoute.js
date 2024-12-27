import express, { Router } from 'express';
import apiRoutes from './apiRoutes';
import simpleRoute from './simpleRoute';

const router = express.Router();

// Mount API routes
router.use('/api', apiRoutes);

// Mount simple route
router.use('/simple', simpleRoute);

export default router;
