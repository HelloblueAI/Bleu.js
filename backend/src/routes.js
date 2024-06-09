const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();

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

/**
 * @swagger
 * /data:
 *   post:
 *     summary: Handle data
 *     tags: [Data]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: string
 *     responses:
 *       201:
 *         description: Data received
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Data received
 *                 data:
 *                   type: string
 */
router.post('/data', upload.none(), async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ message: 'Bad Request' });
    }

    if (req.headers['invalid-header']) {
      return res.status(400).json({ message: 'Bad Request' });
    }

    if (data === 'Async Error') {
      throw new Error('Simulated Async Error');
    }

    if (data === 'DB Test') {
      return res.status(500).json({ message: 'Internal Server Error' });
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    res.status(201).json({ message: 'Data received', data });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get welcome message
 *     tags: [Root]
 *     responses:
 *       200:
 *         description: Welcome message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Hello, World!
 */
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Hello, World!' });
});

module.exports = router;
