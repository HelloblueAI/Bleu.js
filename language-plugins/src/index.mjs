import express from 'express';
const app = express();
const port = 3001;

app.get('/', (req, res) => {
  res.send('Hello from Node.js!');
});

app.listen(port, () => {
  console.log(`Node.js server running on port ${port}`);
});
