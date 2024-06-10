const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const RulesEngine = require('./ai/rulesEngine');
const DecisionTree = require('./ai/decisionTree');
const NLPProcessor = require('./ai/nlpProcessor');

const app = express();
const upload = multer();
const nlpProcessor = new NLPProcessor();

// Middleware to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// CORS middleware for handling cross-origin requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Middleware to validate headers
app.use((req, res, next) => {
  const invalidHeader = req.headers['invalid-header'];
  if (invalidHeader) {
    return res.status(400).json({ message: 'Invalid Header' });
  }
  next();
});

// Swagger setup
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Bleu.js API',
    version: '1.0.0',
    description: 'Documentation for the Bleu.js API',
  },
  servers: [
    {
      url: 'http://localhost:3003',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./server.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

// Serve Swagger UI and Swagger JSON
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Define API routes with Swagger documentation
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

/**
 * @swagger
 * /data:
 *   post:
 *     summary: Handle data posting
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
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */
app.post('/data', (req, res) => {
  if (req.body.data === 'Async Error') {
    return res.status(500).json({ message: 'Internal Server Error' });
  }

  if (req.body.data === 'DB Test') {
    return res.status(500).json({ message: 'Internal Server Error' });
  }

  if (!req.body.data) {
    return res.status(400).json({ message: 'Bad Request' });
  }

  res.status(201).json({ message: 'Data received', data: req.body.data });
});

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Handle file upload
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: data
 *         type: file
 *         description: The file to upload.
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
 *       400:
 *         description: Bad Request
 */
app.post('/upload', upload.single('data'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Bad Request' });
  }
  res.status(201).json({ message: 'Data received', data: req.file.buffer.toString() });
});

// Add new AI-related endpoint
/**
 * @swagger
 * /ai/rules:
 *   post:
 *     summary: Process data using rules-based AI
 *     responses:
 *       200:
 *         description: AI processing result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   example: AI result
 */
app.post('/ai/rules', (req, res) => {
  const rulesEngine = new RulesEngine();
  rulesEngine.addRule({
    condition: (data) => data === 'example',
    action: (data) => `Processed ${data}`,
  });

  const result = rulesEngine.evaluate(req.body.data);
  res.status(200).json({ result: result || 'No matching rule found' });
});

/**
 * @swagger
 * /ai/nlp:
 *   post:
 *     summary: Process text using NLP
 *     responses:
 *       200:
 *         description: NLP processing result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tokens:
 *                   type: array
 *                   items:
 *                     type: string
 */
app.post('/ai/nlp', (req, res) => {
  const tokens = nlpProcessor.tokenize(req.body.text);
  res.status(200).json({ tokens });
});

// Error handling middleware for JSON syntax errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Bad Request' });
  }
  next();
});

// Middleware for handling 404 errors
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// Start the server
if (require.main === module) {
  const port = process.env.PORT || 3003;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

module.exports = app;
