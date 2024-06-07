const express = require('express');
const bodyParser = require('body-parser');
const { ESLint } = require('eslint');
const prettier = require('prettier');
const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// Root endpoint
app.get('/', (req, res) => {
  res.send('Welcome to Bleu.js, powered by Helloblue, running on HenFarm!');
});

// Endpoint for debugging code using ESLint
app.post('/debug', async (req, res) => {
  const { code } = req.body;
  console.log('Received code for debugging:', code);

  const eslint = new ESLint({ overrideConfigFile: '/usr/src/app/.eslintrc.cjs' });

  try {
    const results = await eslint.lintText(code);
    console.log('ESLint results:', results);
    res.json({ results });
  } catch (error) {
    console.error('Error during debugging:', error);
    res.status(500).send('An error occurred while debugging the code.');
  }
});

// Endpoint for optimizing code using Prettier
app.post('/optimize', (req, res) => {
  const { code } = req.body;
  const options = { parser: 'babel' };

  try {
    const optimizedCode = prettier.format(code, options);
    res.json({ optimizedCode });
  } catch (error) {
    console.error('Error during optimization:', error);
    res.status(500).send('An error occurred while optimizing the code.');
  }
});

// Endpoint for generating code based on templates
app.post('/generate', (req, res) => {
  const { template } = req.body;
  let generatedCode;

  switch (template) {
  case 'basic function':
    generatedCode = 'function hello() {\n  console.log("Hello, world!");\n}';
    break;
  default:
    generatedCode = 'Template not recognized';
  }

  res.json({ generatedCode });
});

// Start the server
app.listen(port, () => {
  console.log(`Bleu.js core engine is running at http://localhost:${port}`);
});
