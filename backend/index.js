require('dotenv').config(); // Load environment variables
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const Logger = require('./utils/logger');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger'); // Assuming swagger setup is in swagger.js
const apiRoutes = require('./routes'); // Assuming apiRoutes is in routes directory

const app = express();
const logger = new Logger();
const port = process.env.PORT || 5000;

// Middleware for enhanced security
app.use(helmet());

// Middleware for request compression
app.use(compression());

// HTTP request logger middleware
app.use(morgan('combined'));

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Middleware to parse JSON bodies
app.use(express.json());

// CORS middleware for handling cross-origin requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Middleware for setting correlation ID for tracing
app.use((req, res, next) => {
  const correlationId = logger.setCorrelationId(req);
  res.setHeader('X-Correlation-Id', correlationId);
  next();
});

// Swagger documentation setup
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API routes
app.use('/api', apiRoutes);

// Define a simple route to test server
app.get('/', (req, res) => {
  logger.info('Root endpoint hit', { endpoint: '/' });
  res.status(200).json({ message: 'Hello, World!' });
});

// Error handling middleware for JSON syntax errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.error('JSON syntax error', { error: err.message });
    return res.status(400).json({ message: 'Bad Request' });
  }
  next();
});

// Middleware for handling 404 errors
app.use((req, res, next) => {
  logger.warn('Endpoint not found', { url: req.originalUrl });
  res.status(404).json({ message: 'Not Found' });
});

// Middleware for handling other errors
app.use((err, req, res, next) => {
  logger.error('Internal Server Error', { error: err.stack });
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start the server
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});

module.exports = app;
