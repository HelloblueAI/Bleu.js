const express = require('express');
const app = express();
const port = 5000;  

app.use(express.json());

app.post('/debug', (req, res) => {
  // Debug logic
  res.send('Debugging');
});

app.post('/optimize', (req, res) => {
  // Optimize logic
  res.send('Optimizing');
});

app.post('/generate', (req, res) => {
  // Generate logic
  res.send('Generating');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
