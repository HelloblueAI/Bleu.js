const express = require('express');
const bodyParser = require('body-parser');
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
