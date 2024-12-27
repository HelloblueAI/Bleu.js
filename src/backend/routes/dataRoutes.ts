import express, { Request, Response, NextFunction, Router } from 'express';

import dataController from '../controllers/dataController.ts';

/**
 * Router for data operations
 */
const router: Router = express.Router();

// POST request: Create or process data
router.post('/', (req: Request, res: Response) => {
  dataController.handlePost(req, res);
});

// PUT request: Update existing data
router.put('/', (req: Request, res: Response, next: NextFunction) => {
  dataController.handlePut(req, res, next);
});

// DELETE request: Remove data
router.delete('/', (req: Request, res: Response, next: NextFunction) => {
  dataController.handleDelete(req, res, next);
});

// PATCH request: Partially update data
router.patch('/', (req: Request, res: Response, next: NextFunction) => {
  dataController.handlePatch(req, res, next);
});

// HEAD request: Retrieve headers
router.head('/', (req: Request, res: Response, next: NextFunction) => {
  dataController.handleHead(req, res, next);
});

// OPTIONS request: Provide allowed methods
router.options('/', (req: Request, res: Response, next: NextFunction) => {
  dataController.handleOptions(req, res, next);
});

// GET requests for fetching data in different formats
router.get('/json', (req: Request, res: Response, next: NextFunction) => {
  dataController.handleGetJson(req, res, next);
});

router.get('/html', (req: Request, res: Response, next: NextFunction) => {
  dataController.handleGetHtml(req, res, next);
});

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  dataController.handleGet(req, res, next);
});

export default router;
