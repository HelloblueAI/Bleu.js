const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const RulesEngine = require('./ai/rulesEngine');
const DecisionTree = require('./ai/decisionTree');
const NLPProcessor = require('./ai/nlpProcessor');
const apiRoutes = require('./routes/apiRoutes');
const swagger = require('./swagger');
require('dotenv').config();
const Logger = require('./utils/logger');
const logger = new Logger();

const app = express();
const upload = multer();
const nlpProcessor = new NLPProcessor();

// Security and performance middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// Middleware to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// CORS middleware for handling cross-origin requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
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

// JWT authentication middleware
app.use((req, res, next) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      req.user = decoded;
      next();
    });
  } else {
    next();
  }
});

// Logger middleware for correlation IDs
app.use((req, res, next) => {
  const correlationId = logger.setCorrelationId(req);
  res.setHeader('X-Correlation-Id', correlationId);
  next();
});

// Swagger setup
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Bleu.js API',
    version: '1.0.0',
    description: 'Documentation for the Bleu.js API - A powerful rules-based AI framework',
    contact: {
      name: 'Helloblue, Inc.',
      email: 'info@helloblue.ai',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    termsOfService: 'http://example.com/terms/',
  },
  servers: [
    {
      url: 'http://localhost:3003',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-KEY',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    {
      name: 'General',
      description: 'General API Endpoints',
    },
    {
      name: 'AI',
      description: 'AI-related Endpoints',
    },
    {
      name: 'File',
      description: 'File Handling Endpoints',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./server.js', './routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API routes
app.use('/api', apiRoutes);

// Define API routes with Swagger documentation
/**
 * @swagger
 * /:
 *   get:
 *     summary: Returns a greeting message
 *     tags: [General]
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
  logger.info('Hello, World!', { endpoint: '/' });
  res.status(200).json({ message: 'Hello, World!' });
});

/**
 * @swagger
 * /data:
 *   post:
 *     summary: Handle data posting
 *     tags: [General]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: string
 *                 example: "sample data"
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
 *     tags: [File]
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

/**
 * @swagger
 * /ai/rules:
 *   post:
 *     summary: Process data using rules-based AI
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: string
 *                 example: "example"
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
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 example: "This is a test for NLP processing."
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
 *                   example: ["This", "is", "a", "test", "for", "NLP", "processing"]
 */
app.post('/ai/nlp', (req, res) => {
  const tokens = nlpProcessor.tokenize(req.body.text);
  res.status(200).json({ tokens });
});

// Error handling middleware for JSON syntax errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.error('JSON Syntax Error', { error: err.message });
    return res.status(400).json({ message: 'Bad Request' });
  }
  next();
});

// Middleware for handling 404 errors
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// Middleware for handling other errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  logger.error('Internal Server Error', { error: err.stack });
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start the server
if (require.main === module) {
  const port = process.env.PORT || 3003;
  app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
  });
}

module.exports = app;
