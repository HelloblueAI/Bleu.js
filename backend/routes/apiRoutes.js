import { Router } from 'express';

import {
  getRules,
  addRule,
  updateRule,
  deleteRule,
  monitorDependencies,
  trainModel,
} from '../controllers/rulesController.js';

const router = Router();

router.get('/rules', getRules);
router.post('/rules', addRule);
router.put('/rules/:id', updateRule);
router.delete('/rules/:id', deleteRule);
router.get('/dependencies', monitorDependencies);
router.post('/trainModel', trainModel);

export default router;
