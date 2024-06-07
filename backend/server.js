const express = require('express');
const bodyParser = require('body-parser');
<<<<<<< HEAD

const app = express();
app.use(bodyParser.json());

// Route handlers
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Hello, World!' });
});

app.post('/data', (req, res) => {
  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ message: 'Bad Request' });
  }
  res.status(201).json({ message: 'Data received', data });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Bad Request' });
  }
  next();
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
=======
const app = express();
const port = 5000;

app.use(bodyParser.json());

app.post('/debug', (req, res) => {
  const { code } = req.body;
  console.log('Received code:', code);
  res.json({
    message: 'Executed code successfully',
    code: code
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
>>>>>>> 5bf653fe8871e41c3e51029ea561ce5388cf6f25
