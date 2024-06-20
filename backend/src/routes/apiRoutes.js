/* eslint-env node */
const express = require('express');

const router = express.Router();
const apiController = require('../controllers/apiController');

router.post('/predict', apiController.predict);
router.post('/processData', apiController.processData);
router.get('/getProcessedData', apiController.getProcessedData);
router.post('/trainModel', apiController.trainModel);
router.get('/trainModel/status', apiController.getTrainModelStatus);
router.post('/uploadDataset', apiController.uploadDataset);
router.get('/rules', apiController.getRules);
router.post('/rules', apiController.addRule);
router.put('/rules/:id', apiController.updateRule);
router.delete('/rules/:id', apiController.deleteRule);
router.post('/evaluateRule/:id', apiController.evaluateRule);

router.use(apiController.invalidRoute);

module.exports = router;
