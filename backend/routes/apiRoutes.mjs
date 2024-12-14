import express from 'express';
import * as apiController from '../controllers/apiController.mjs';

const router = express.Router();

// Data routes
router.get('/data', apiController.getData);
router.post('/processData', apiController.processData);
router.get('/processedData', apiController.getProcessedData);

// AI-related routes
router.post('/predict', apiController.predict);
router.post('/generate', apiController.generateAIResponse);

// Training and Dataset routes
router.post('/trainModel', apiController.trainModel);
router.get('/trainModel/status', apiController.getTrainModelStatus);
router.post('/uploadDataset', apiController.uploadDataset);

// Rule management routes
router.get('/rules', apiController.getRules);
router.post('/rules', apiController.addRule);
router.put('/rules/:id', apiController.updateRule);
router.delete('/rules/:id', apiController.deleteRule);
router.post('/evaluateRule/:id', apiController.evaluateRule);

// Eggs-related routes
router.post('/generate-egg', apiController.generateEgg);

// Dependency monitoring
router.get('/dependencies', apiController.monitorDependencies);
router.get('/dependencies/conflicts', apiController.resolveConflicts);

// Debugging route
router.post('/debug', apiController.debug);

// Catch-all route for invalid paths
router.all('*', apiController.invalidRoute);

export default router;
