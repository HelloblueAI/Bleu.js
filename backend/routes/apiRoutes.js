const express = require('express');

const apiController = require('../controllers/apiController');

const router = express.Router();

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
router.post('/generate-egg', apiController.generateEgg);
router.get('/dependencies', apiController.monitorDependencies);
router.get('/dependencies/conflicts', apiController.resolveConflicts);
router.post('/debug', apiController.debug);


router.post('/generate', apiController.generateAIResponse); 


router.all('*', apiController.invalidRoute);

module.exports = router;
