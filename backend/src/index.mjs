import express from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.mjs'; // Ensure correct relative path
import apiRoutes from './routes/apiRoutes.mjs'; // Ensure correct relative path
import Logger from './utils/logger.mjs';
import dotenv from 'dotenv';
import AIService from './services/aiService.mjs'; // Ensure correct relative path

dotenv.config(); // Load environment variables

const app = express();
const upload = multer();
const logger = new Logger();
const aiService = new AIService();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

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

app.use((req, res, next) => {
  const correlationId = logger.setCorrelationId(req);
  res.setHeader('X-Correlation-Id', correlationId);
  next();
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  logger.info('Hello, World!', { endpoint: '/' });
  res.status(200).json({ message: 'Hello, World!' });
});

app.post('/api/rules', async (req, res) => {
  try {
    await aiService.addRule(req.body);
    res.status(201).json({ message: 'Rule added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding rule', error: error.message });
  }
});

app.delete('/api/rules/:id', async (req, res) => {
  try {
    await aiService.removeRule(req.params.id);
    res.status(200).json({ message: 'Rule removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing rule', error: error.message });
  }
});

app.put('/api/rules/:id', async (req, res) => {
  try {
    await aiService.updateRule(req.params.id, req.body);
    res.status(200).json({ message: 'Rule updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating rule', error: error.message });
  }
});

app.post('/api/rules/evaluate', async (req, res) => {
  try {
    const result = await aiService.evaluateRules(req.body);
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: 'Error evaluating rules', error: error.message });
  }
});

app.post('/api/ai/predict', async (req, res) => {
  try {
    const result = await aiService.predictDecision(req.body);
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: 'Error predicting decision', error: error.message });
  }
});

app.post('/api/ai/process-text', async (req, res) => {
  try {
    const result = await aiService.processText(req.body.text);
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: 'Error processing text', error: error.message });
  }
});

app.post('/api/ai/process-text-advanced', async (req, res) => {
  try {
    const result = await aiService.processTextAdvanced(req.body.text, req.body.options);
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: 'Error processing text with advanced options', error: error.message });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.error('JSON syntax error', { error: err.message });
    return res.status(400).json({ message: 'Bad Request' });
  }
  next();
});

app.use((req, res, next) => {
  logger.warn('Endpoint not found', { url: req.originalUrl });
  res.status(404).json({ message: 'Not Found' });
});

app.use((err, req, res, next) => {
  logger.error('Internal Server Error', { error: err.stack });
  res.status(500).json({ message: 'Internal Server Error' });
});

const port = process.env.PORT || 3003;
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});

export default app;
