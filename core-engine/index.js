const express = require('express');
const bodyParser = require('body-parser');
const { ESLint } = require('eslint');
const prettier = require('prettier');
const app = express();
const port = 3000;

// Use body-parser middleware to parse JSON request bodies
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello from Bleu.js, powered by Helloblue, Run on HenFarm!');
});

app.post('/debug', async (req, res) => {
  const { code } = req.body;
  console.log("Received code for debugging:", code);
  const eslint = new ESLint({ overrideConfigFile: "/usr/src/app/.eslintrc.cjs" });
  try {
    const results = await eslint.lintText(code);
    console.log("ESLint results:", results);
    res.json({ results });
  } catch (error) {
    console.error("Error during debugging:", error);
    res.status(500).send('An error occurred while debugging the code.');
  }
});

app.post('/optimize', (req, res) => {
  const { code } = req.body;
  const options = { parser: "babel" };
  try {
    const optimizedCode = prettier.format(code, options);
    res.json({ optimizedCode });
  } catch (error) {
    console.error("Error during optimization:", error);
    res.status(500).send('An error occurred while optimizing the code.');
  }
});

app.post('/generate', (req, res) => {
  const { template } = req.body;
  let generatedCode;
  if (template === 'basic function') {
    generatedCode = `function hello() {\n  console.log("Hello, world!");\n}`;
  } else {
    generatedCode = 'Template not recognized';
  }
  res.json({ generatedCode });
});

app.listen(port, () => {
  console.log(`Bleu.js core engine running at http://localhost:${port}`);
});
