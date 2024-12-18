import express from 'express';

import apiController from '../controllers/apiController.js';

const router = express.Router();

// Data-related routes
router.get('/data', apiController.getData);
router.post('/predict', apiController.predict);
router.post('/processData', apiController.processData);
router.get('/processedData', apiController.getProcessedData);
router.post('/trainModel', apiController.trainModel);
router.get('/trainModel/status', apiController.getTrainModelStatus);
router.post('/uploadDataset', apiController.uploadDataset);

// Rule management routes
router.get('/rules', apiController.getRules);
router.post('/rules', apiController.addRule);
router.put('/rules/:id', apiController.updateRule);
router.delete('/rules/:id', apiController.deleteRule);
router.post('/evaluateRule/:id', apiController.evaluateRule);

// AI and model management routes
router.post('/generate-egg', apiController.generateEgg);
router.get('/dependencies', apiController.monitorDependencies);
router.get('/dependencies/conflicts', apiController.resolveConflicts);
router.post('/debug', apiController.debug);

// OpenAI-related route
router.post('/generate', apiController.generateAIResponse);

// Catch-all route for invalid endpoints
router.all('*', apiController.invalidRoute);

export default router;
