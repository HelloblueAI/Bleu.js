const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const routes = require('./routes'); // Move this line down

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());

const headers = [
  'Access-Control-Allow-Headers',
  'Origin, X-Requested-With, Content-Type, Accept, Authorization',
];

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Headers', headers.join(',\n'));
  next();
});

app.use('/', routes); // Place this line here

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
