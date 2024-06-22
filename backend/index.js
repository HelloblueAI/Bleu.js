const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const {
  monitorDependencies,
  resolveConflicts,
} = require('../dependency-management/src/index');
const { generateEgg } = require('../eggs-generator/src/index');

const routes = require('./routes');

require('dotenv').config();

const app = express();

const corsOptions = {
  origin: 'http://localhost:4002',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );
  res.header('Access-Control-Allow-Origin', 'http://localhost:4002');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

app.use('/', routes);

app.get('/api/dependencies', (req, res) => {
  const { dependencies, outdated } = monitorDependencies();
  res.json({ dependencies, outdated });
});

app.get('/api/dependencies/conflicts', (req, res) => {
  const { resolved, conflicts } = resolveConflicts();
  res.json({ resolved, conflicts });
});

app.post('/api/generate-egg', (req, res) => {
  const eggOptions = req.body;
  const generatedEgg = generateEgg(eggOptions);
  res.json(generatedEgg);
});

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
