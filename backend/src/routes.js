const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Debug
 *     description: Debugging operations
 *   - name: Optimization
 *     description: Optimization operations
 *   - name: Generation
 *     description: Generation operations
 */

/**
 * @swagger
 * /debug:
 *   post:
 *     summary: Debug logic
 *     tags: [Debug]
 *     responses:
 *       200:
 *         description: Debugging
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: Debugging
 */
router.post('/debug', (req, res) => {
  res.send('Debugging');
});

/**
 * @swagger
 * /optimize:
 *   post:
 *     summary: Optimize logic
 *     tags: [Optimization]
 *     responses:
 *       200:
 *         description: Optimizing
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: Optimizing
 */
router.post('/optimize', (req, res) => {
  res.send('Optimizing');
});

/**
 * @swagger
 * /generate:
 *   post:
 *     summary: Generate logic
 *     tags: [Generation]
 *     responses:
 *       200:
 *         description: Generating
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: Generating
 */
router.post('/generate', (req, res) => {
  res.send('Generating');
});

module.exports = router;
