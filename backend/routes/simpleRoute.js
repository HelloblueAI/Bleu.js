/* eslint-env node */
import { Router } from 'express';
const router = Router();

router.get('/simple', (req, res) => {
  res.send('Hello from simple server!');
});

export default router;
