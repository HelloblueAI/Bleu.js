import { Router } from 'express';
import {
  getRules,
  addRule,
  updateRule,
  deleteRule,
  monitorDependencies,
  trainModel,
} from '../controllers/rulesController.mjs';

const router = Router();

/**
 * Route: GET /rules
 * Description: Fetch all rules
 */
router.get('/rules', async (req, res, next) => {
  try {
    await getRules(req, res);
  } catch (error) {
    console.error('Error in GET /rules:', error);
    next(error);
  }
});

/**
 * Route: POST /rules
 * Description: Add a new rule
 */
router.post('/rules', async (req, res, next) => {
  try {
    await addRule(req, res);
  } catch (error) {
    console.error('Error in POST /rules:', error);
    next(error);
  }
});

/**
 * Route: PUT /rules/:id
 * Description: Update a specific rule by ID
 */
router.put('/rules/:id', async (req, res, next) => {
  try {
    await updateRule(req, res);
  } catch (error) {
    console.error('Error in PUT /rules/:id:', error);
    next(error);
  }
});

/**
 * Route: DELETE /rules/:id
 * Description: Delete a specific rule by ID
 */
router.delete('/rules/:id', async (req, res, next) => {
  try {
    await deleteRule(req, res);
  } catch (error) {
    console.error('Error in DELETE /rules/:id:', error);
    next(error);
  }
});

/**
 * Route: GET /dependencies
 * Description: Monitor system dependencies
 */
router.get('/dependencies', async (req, res, next) => {
  try {
    await monitorDependencies(req, res);
  } catch (error) {
    console.error('Error in GET /dependencies:', error);
    next(error);
  }
});

/**
 * Route: POST /trainModel
 * Description: Train a machine learning model
 */
router.post('/trainModel', async (req, res, next) => {
  try {
    await trainModel(req, res);
  } catch (error) {
    console.error('Error in POST /trainModel:', error);
    next(error);
  }
});

// Middleware to handle 404 for undefined routes
router.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
router.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default router;
