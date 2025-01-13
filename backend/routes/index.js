/* eslint-env node */
import { Router } from 'express';

const router = Router();
import apiRoutes from './apiRoutes';

router.use('/api', apiRoutes);

export default router;
