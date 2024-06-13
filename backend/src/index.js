import express from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js'; // Ensure correct relative path
import apiRoutes from './routes/apiRoutes.js'; // Ensure correct relative path
import Logger from './utils/logger.js';

const app = express();
const upload = multer();
const logger = new Logger();

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
