import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Eggs-Generator is running smoothly!',
    timestamp: new Date().toISOString(),
  });
});

export default router;

