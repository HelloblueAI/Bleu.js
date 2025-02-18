const express = require('express');
const router = express.Router();
const { apiKeyAuth, jwtAuth, apiLimiter } = require('../middleware/auth');
const { generateEgg } = require('../controllers/eggController');

router.use(apiLimiter);
router.use(apiKeyAuth);

router.post('/generate-egg', jwtAuth, generateEgg);

router.get('/list', jwtAuth, async (req, res) => {
  try {
    const eggs = await Egg.find({ owner: req.user.id });
    res.json(eggs);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
