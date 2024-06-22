// backend/routes/apiRoutes.js
const express = require('express');

const router = express.Router();
const apiController = require('../controllers/apiController');
const Bleu = require('../../eggs-generator/src/Bleu');

const bleu = new Bleu();

router.get('/data', apiController.getData);

router.post('/predict', apiController.predict);
router.post('/processData', apiController.processData);
router.get('/processedData', apiController.getProcessedData);
router.post('/trainModel', apiController.trainModel);
router.get('/trainModel/status', apiController.getTrainModelStatus);
router.post('/uploadDataset', apiController.uploadDataset);

router.get('/rules', apiController.getRules);
router.post('/rules', apiController.addRule);
router.put('/rules/:id', apiController.updateRule);
router.delete('/rules/:id', apiController.deleteRule);
router.post('/evaluateRule/:id', apiController.evaluateRule);

// Route to generate an egg
router.post('/generate-egg', (req, res) => {
  const { description, type, options } = req.body;
  try {
    const egg = bleu.generateEgg(description, type, options);
    res.status(200).json(egg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.all('*', apiController.invalidRoute);

module.exports = router;
