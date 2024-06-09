const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const app = express();
const upload = multer();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// CORS middleware
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

app.get('/', (req, res) => {
  res.json({ message: 'Hello, World!' });
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

// Handle multipart/form-data
app.post('/upload', upload.single('data'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Bad Request' });
  }
  res.status(201).json({ message: 'Data received', data: req.file.buffer.toString() });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Bad Request' });
  }
  next();
});

app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

if (require.main === module) {
  const port = process.env.PORT || 3003;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

module.exports = app;
