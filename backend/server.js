const express = require('express');
const bodyParser = require('body-parser');
const swaggerSetup = require('./swagger');
const { swaggerSpec } = require('./swagger'); // Import swaggerSpec
const routes = require('./src/routes');

const app = express();
app.use(bodyParser.json());

/**
 * @swagger
 * /:
 *   get:
 *     summary: Returns a greeting message
 *     responses:
 *       200:
 *         description: A JSON object containing a greeting message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Hello, World!
 */
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Hello, World!' });
});

// Integrate routes
app.use('/', routes);

// Add route to serve raw Swagger JSON for debugging
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Setup Swagger
swaggerSetup(app);

const port = process.env.PORT || 3003;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
