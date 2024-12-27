import express, { Router } from 'express';

const router: Router = express.Router();

// Define routes here
router.get('/', (_, res) => {
  res.send('Simple route');
});

export default router;
