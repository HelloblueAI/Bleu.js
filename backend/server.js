import express from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import RulesEngine from './services/ruleEngine.js';
import DecisionTree from './ai/decisionTree.js';
import NLPProcessor from './ai/nlpProcessor.js';
import apiRoutes from './routes/apiRoutes.js';
import swagger from './swagger.js';
import dotenv from 'dotenv';
import Logger from './utils/logger.js';

dotenv.config();
const logger = new Logger();
const app = express();
const upload = multer();
const nlpProcessor = new NLPProcessor();
const rulesEngine = new RulesEngine();

app.post('/ai/rules', (req, res) => {
  console.log('POST /ai/rules called');
  const data = req.body.data;

  rulesEngine.addRule({
    name: 'Another Test Rule',
    conditions: {
      all: [
        {
          fact: 'data',
          operator: 'equal',
          value: 'another example',
        },
      ],
    },
    event: {
      type: 'ruleTriggered',
      params: {
        message: 'Another test rule has been triggered',
      },
    },
  });
  

  const result = rulesEngine.evaluate(data);
  res.status(200).json({ result: result || 'No matching rule found' });
});



app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

app.use((req, res, next) => {
  const invalidHeader = req.headers['invalid-header'];
  if (invalidHeader) {
    return res.status(400).json({ message: 'Invalid Header' });
  }
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

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  logger.info('Hello, World!', { endpoint: '/' });
  res.status(200).json({ message: 'Hello, World!' });
});

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

app.post('/upload', upload.single('data'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Bad Request' });
  }
  res.status(201).json({ message: 'Data received', data: req.file.buffer.toString() });
});

app.post('/ai/rules', (req, res) => {
  console.log('POST /ai/rules called');
  console.log(`Request received at /api/ai/rules with data: ${JSON.stringify(req.body)}`);

  const result = rulesEngine.evaluate(req.body.data);
  console.log(`Rules evaluated: ${JSON.stringify(result)}`);
  
  res.status(200).json({ result: result || 'No matching rule found' });
});

app.post('/ai/nlp', (req, res) => {
  const tokens = nlpProcessor.tokenize(req.body.text);
  res.status(200).json({ tokens });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.error('JSON Syntax Error', { error: err.message });
    return res.status(400).json({ message: 'Bad Request' });
  }
  next();
});

app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  logger.error('Internal Server Error', { error: err.stack });
  res.status(500).json({ message: 'Internal Server Error' });
});

if (require.main === module) {
  const port = process.env.PORT || 3004;
  app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
  });
}

export default app;
