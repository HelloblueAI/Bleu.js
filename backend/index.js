const express = require('express');
const app = express();
const port = 5000;

app.use(express.json());

app.post('/debug', (req, res) => {
  res.send('Debugging');
});

app.post('/optimize', (req, res) => {
  res.send('Optimizing');
});

app.post('/generate', (req, res) => {
  res.send('Generating');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
